import fs from "node:fs";
import path from "node:path";
import { getContext } from "./context";
import GitHub from "./providers/github";
import Vercel from "./providers/vercel";
import Cloudflare from "./providers/cloudflare";
import * as log from "./providers/logger";
import { retry, sleep } from "./providers/utils";
import type { ProviderResult } from "./providers/types";
import { runWorkflow } from "./workflowRunner";
import type { WorkflowDefinition, WorkflowExecutor, WorkflowStep } from "./workflowRunner";
import { generateReport, recordRepair } from "./deliveryReportArchive";
import type { RepairEntry } from "./deliveryReportArchive";
import type { ProjectIdentity } from "./types/identity";

/* ============================================================================
 * Interfaces — unchanged, preserves workflowRunner compatibility
 * ============================================================================
 */

export interface PipelineState {
  identity: ProjectIdentity;
  domain: string;
  environment: string;
  repoFullName: string;
  projectSlug: string;
  projectFolder: string;
  vercelProjectName: string;
  zoneId: string;
  projectId: string;
  deploymentId: string;
  deploymentUrl: string;
  repairHistory: RepairEntry[];
  checks: DeliveryCheck[];
  failureReason: string | null;
}

export interface StepResult {
  step: number;
  name: string;
  provider: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface DeploymentReport {
  domain: string;
  environment: string;
  timestamp: number;
  dryRun: boolean;
  steps: StepResult[];
  passed: boolean;
  state: PipelineState;
  totalDuration: number;
}

export interface DeliveryCheck {
  step: number;
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface DeliveryReport {
  deploymentUrl: string;
  productionUrl: string;
  dashboardUrl: string;
  adminUsername: string;
  adminPassword: string;
  httpsStatus: string;
  dnsStatus: string;
  buildStatus: string;
  deploymentTime: string;
  deliveryStatus: string;
  checks: DeliveryCheck[];
  passed: boolean;
  totalDuration: number;
}

export interface DeployOptions {
  dryRun: boolean;
  skipGitHub: boolean;
  skipCloudflare: boolean;
  skipVercel: boolean;
}

/* ============================================================================
 * Config loaders
 * ============================================================================
 */

interface VercelConfig {
  provider: string;
  template_project: string;
  framework: string;
  auto_deploy: boolean;
}

interface CloudflareConfig {
  provider: string;
  dns_management: boolean;
  ssl: boolean;
  proxy: boolean;
}

const DEFAULT_OPTIONS: DeployOptions = {
  dryRun: false,
  skipGitHub: false,
  skipCloudflare: false,
  skipVercel: false,
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function loadVercelConfig(): VercelConfig {
  return readJson<VercelConfig>(
    path.join(getContext().deploymentRoot, "vercel.config.json"),
  );
}

function loadCloudflareConfig(): CloudflareConfig {
  return readJson<CloudflareConfig>(
    path.join(getContext().deploymentRoot, "cloudflare.config.json"),
  );
}

function loadWorkflow(): WorkflowDefinition {
  return readJson<WorkflowDefinition>(
    path.join(getContext().deploymentRoot, "deployment.workflow.json"),
  );
}

/* ============================================================================
 * State helpers
 * ============================================================================
 */

function buildInitialState(): PipelineState {
  const identity = getContext().identity;
  return {
    identity,
    domain: identity.productDomain,
    environment: getContext().environment,
    repoFullName: getContext().githubRepository,
    projectSlug: identity.productSlug,
    projectFolder: identity.productSlug,
    vercelProjectName: "",
    zoneId: "",
    projectId: "",
    deploymentId: "",
    deploymentUrl: "",
    repairHistory: [],
    checks: [],
    failureReason: null,
  };
}

function requireSuccess<T>(result: ProviderResult<T>, stepName: string): T {
  if (!result.success) {
    throw new Error(`${stepName}: ${result.error}`);
  }
  return result.data as T;
}

/* ============================================================================
 * Delivery check helper
 * ============================================================================
 */

async function deliveryCheck(
  step: number,
  name: string,
  fn: () => Promise<void>,
): Promise<DeliveryCheck> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    log.info("deploy", name, `PASSED (${duration}ms)`);
    return { step, name, passed: true, message: "OK", duration };
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    log.error("deploy", name, `FAILED (${duration}ms): ${message}`);
    return { step, name, passed: false, message, duration };
  }
}

/* ============================================================================
 * Unique project name generator
 *
 * Tries: slug → slug-2 → slug-3 → slug-YYYYMMDD → slug-YYYYMMDD-2
 * Never reuses an existing Vercel project.
 * ============================================================================
 */

function dateStamp(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function projectNameCandidates(slug: string): string[] {
  const stamp = dateStamp();
  return [
    slug,
    `${slug}-2`,
    `${slug}-3`,
    `${slug}-4`,
    `${slug}-5`,
    `${slug}-prod`,
    `${slug}-${stamp}`,
    `${slug}-${stamp}-2`,
  ];
}

async function createProjectWithUniqueName(
  slug: string,
  framework: string,
): Promise<{ projectId: string; projectName: string }> {
  const candidates = projectNameCandidates(slug);

  for (const name of candidates) {
    log.info("deploy", "createProject", `attempting project name: ${name}`);

    const result = await Vercel.createProject({ name, framework });
    if (result.success && result.data) {
      log.info("deploy", "createProject", `created: ${result.data.projectId} (${name})`);
      return { projectId: result.data.projectId, projectName: result.data.name };
    }

    const err = result.error ?? "";
    if (result.success === false && err.includes("409")) {
      log.info("deploy", "createProject", `"${name}" taken — trying next candidate`);
      continue;
    }

    throw new Error(`createProject failed for "${name}": ${err}`);
  }

  throw new Error(
    `All project name candidates exhausted for slug "${slug}". Tried: ${candidates.join(", ")}`,
  );
}

/* ============================================================================
 * Step runner
 * ============================================================================
 */

async function runStep(
  step: number,
  name: string,
  provider: string,
  dryRun: boolean,
  fn: () => Promise<void>,
): Promise<StepResult> {
  if (dryRun) {
    log.info("deploy", name, `DRY RUN — skipping execution`);
    return { step, name, provider, passed: true, message: "dry run — skipped", duration: 0 };
  }

  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    log.info("deploy", name, `COMPLETED (${duration}ms)`);
    return { step, name, provider, passed: true, message: "OK", duration };
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    log.error("deploy", name, `FAILED (${duration}ms): ${message}`);
    return { step, name, provider, passed: false, message, duration };
  }
}

/* ============================================================================
 * Step 1 — create_github
 * ============================================================================
 */

async function stepCreateGithub(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    if (!state.repoFullName) {
      throw new Error("githubRepository is not configured");
    }

    const [owner, repo] = state.repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid repoFullName format: ${state.repoFullName} (expected owner/repo)`);
    }

    const exists = await GitHub.repoExists(state.repoFullName);
    requireSuccess(exists, "repoExists");

    if (exists.data === true) {
      log.info("deploy", "create_github", `monorepo exists: ${state.repoFullName}`);
      return;
    }

    const createResult = await GitHub.createRepo({
      name: repo,
      description: "Website Factory monorepo — all website deployments",
      private: true,
      autoInit: true,
      defaultBranch: "main",
    });
    requireSuccess(createResult, "createRepo");

    log.info("deploy", "create_github", `monorepo created: ${state.repoFullName}`);
  });
}

/* ============================================================================
 * Step 2 — push_code
 * ============================================================================
 */

async function stepPushCode(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    if (!state.repoFullName) {
      throw new Error("githubRepository is not configured");
    }

    const pushResult = await GitHub.pushFolderCode({
      repoFullName: state.repoFullName,
      branch: "main",
      message: `deploy: ${state.identity.productDomain} → ${state.identity.productSlug}`,
      sourceDir: ".",
      folderName: state.identity.productSlug,
    });
    requireSuccess(pushResult, "pushFolderCode");
  });
}

/* ============================================================================
 * Step 3 — create_project
 * ============================================================================
 */

async function stepCreateProject(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const vConfig = loadVercelConfig();

    const result = await Vercel.createProject({
      name: state.identity.productSlug,
      framework: vConfig.framework,
      rootDirectory: state.identity.productSlug,
      teamId: "glotalk",
    });

    if (result.success && result.data) {
      state.projectId = result.data.projectId;
      state.vercelProjectName = result.data.name;
      log.info("deploy", "create_project", `project: ${result.data.name} (${result.data.projectId})`);
    } else {
      throw new Error(`createProject failed for "${state.identity.productSlug}": ${result.error}`);
    }
  });
}

/* ============================================================================
 * Step 2 — connect_github
 * ============================================================================
 */

async function stepConnectGithub(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    if (!state.repoFullName) {
      throw new Error("githubRepository is not configured");
    }

    const exists = await GitHub.repoExists(state.repoFullName);
    requireSuccess(exists, "repoExists");

    if (exists.data === false) {
      throw new Error(`repo does not exist: ${state.repoFullName}`);
    }

    const linkResult = await Vercel.connectGithub(
      state.projectId,
      state.repoFullName,
      "main",
      state.identity.productSlug,
    );
    requireSuccess(linkResult, "connectGithub");
  });
}

/* ============================================================================
 * Step 3 — configure_env
 * ============================================================================
 */

async function stepConfigureEnv(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const envResult = await Vercel.setEnvironmentVariables(state.projectId, {
      NODE_ENV: state.environment,
      DOMAIN: state.identity.productDomain,
      GITHUB_REPO: state.repoFullName,
      ADMIN_EMAIL: getContext().defaultAdminEmail,
      ADMIN_PASSWORD: getContext().defaultAdminPassword,
    });
    requireSuccess(envResult, "setEnvironmentVariables");
  });
}

/* ============================================================================
 * Step 4 — deploy_project
 * ============================================================================
 */

async function stepDeployProject(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const deployResult = await Vercel.deploy({
      projectId: state.projectId,
      gitRef: "main",
      name: `${state.vercelProjectName}-${state.environment}`,
      target: state.environment === "production" ? "production" : "preview",
    });

    const deploy = requireSuccess(deployResult, "deploy");
    state.deploymentId = deploy.deploymentId;
    state.deploymentUrl = deploy.url;

    log.info("deploy", "deploy_project", `waiting for deployment ${state.deploymentId} to be READY...`);

    await retry(
      async () => {
        const status = await Vercel.getDeploymentStatus(state.deploymentId);
        const data = requireSuccess(status, "getDeploymentStatus");

        log.info("deploy", "deploy_project", `deployment status: ${data.readyState}`);

        if (data.readyState !== "READY" && data.readyState !== "ERROR") {
          throw new Error(`Deployment not ready yet: ${data.readyState}`);
        }

        if (data.readyState === "ERROR") {
          throw new Error("Deployment entered ERROR state");
        }
      },
      { maxAttempts: 30, delayMs: 10_000, backoffMultiplier: 1 },
    );

    log.info("deploy", "deploy_project", `deployment READY: ${state.deploymentId}`);
  });
}

/* ============================================================================
 * Step 5 — bind_domain
 * ============================================================================
 */

async function stepBindDomain(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    if (!state.projectId) {
      throw new Error("projectId not set — create_project must run first");
    }

    const apexResult = await Vercel.bindDomain({
      domain: state.identity.productDomain,
      projectId: state.projectId,
    });
    requireSuccess(apexResult, "bindDomain/apex");

    const wwwDomain = `www.${state.identity.productDomain}`;
    const wwwResult = await Vercel.bindDomain({
      domain: wwwDomain,
      projectId: state.projectId,
    });
    requireSuccess(wwwResult, "bindDomain/www");
  });
}

/* ============================================================================
 * Step 6 — configure_cloudflare_dns
 * ============================================================================
 */

async function stepConfigureCloudflareDns(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const zone = await Cloudflare.getZone(state.identity.productDomain);
    const zoneData = requireSuccess(zone, "getZone");
    state.zoneId = zoneData.zoneId;

    const rootDomain = state.identity.productDomain.split(".").slice(-2).join(".");
    const subdomain = state.identity.productDomain.replace(`.${rootDomain}`, "");

    await Cloudflare.addDnsRecord(state.zoneId, {
      type: "A",
      name: subdomain || "@",
      content: "76.76.21.21",
      ttl: 1,
      proxied: true,
    });

    await Cloudflare.addDnsRecord(state.zoneId, {
      type: "CNAME",
      name: "www",
      content: "cname.vercel-dns.com",
      ttl: 1,
      proxied: false,
    });
  });
}

/* ============================================================================
 * Step 7 — verify_dns
 * ============================================================================
 */

async function stepVerifyDns(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    if (!state.zoneId) {
      throw new Error("zoneId not set — configure_cloudflare_dns must run first");
    }

    await retry(
      async () => {
        const records = await Cloudflare.listDnsRecords(state.zoneId);
        const data = requireSuccess(records, "listDnsRecords");

        const rootDomain = state.identity.productDomain.split(".").slice(-2).join(".");
        const apexName = state.identity.productDomain.replace(`.${rootDomain}`, "") || "@";
        const wwwName = "www";

        const apexRecord = data.find(
          (r) => r.name === apexName && (r.type === "A" || r.type === "CNAME"),
        );
        if (!apexRecord) {
          throw new Error(`DNS record for apex "${apexName}" not found`);
        }

        const wwwRecord = data.find(
          (r) => r.name === wwwName && r.type === "CNAME",
        );
        if (!wwwRecord) {
          throw new Error(`DNS record for www "${wwwName}" not found`);
        }
      },
      { maxAttempts: 10, delayMs: 5_000, backoffMultiplier: 1 },
    );
  });
}

/* ============================================================================
 * Step 8 — verify_https
 * ============================================================================
 */

async function stepVerifyHttps(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const urls = [`https://${state.identity.productDomain}`, `https://www.${state.identity.productDomain}`];

    for (const url of urls) {
      await retry(
        async () => {
          const resp = await fetch(url, { redirect: "follow" });
          if (!resp.ok) {
            throw new Error(`${url} returned HTTP ${resp.status}`);
          }
          log.info("deploy", "verify_https", `${url} → ${resp.status} OK`);
        },
        { maxAttempts: 10, delayMs: 10_000, backoffMultiplier: 1 },
      );
    }
  });
}

/* ============================================================================
 * Step 9 — verify_homepage
 * ============================================================================
 */

async function stepVerifyHomepage(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const url = `https://${state.identity.productDomain}`;

    await retry(
      async () => {
        const resp = await fetch(url, { redirect: "follow" });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const html = await resp.text();
        if (html.length < 30_000) {
          throw new Error(`Homepage too small: ${html.length} bytes (expected > 30KB)`);
        }

        log.info("deploy", "verify_homepage", `homepage: ${resp.status}, ${html.length} bytes`);
      },
      { maxAttempts: 5, delayMs: 10_000, backoffMultiplier: 1 },
    );
  });
}

/* ============================================================================
 * Step 10 — verify_dashboard_login
 * ============================================================================
 */

async function stepVerifyDashboardLogin(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const loginUrl = `https://${state.identity.productDomain}/login`;

    await retry(
      async () => {
        const resp = await fetch(loginUrl, { redirect: "follow" });
        if (!resp.ok) {
          throw new Error(`/login returned HTTP ${resp.status}`);
        }

        const html = await resp.text();
        if (!html.includes("login") && !html.includes("Login") && !html.includes("sign in")) {
          throw new Error(`/login page does not appear to be a login form`);
        }

        log.info("deploy", "verify_dashboard_login", `/login accessible: ${resp.status}`);
      },
      { maxAttempts: 5, delayMs: 10_000, backoffMultiplier: 1 },
    );
  });
}

/* ============================================================================
 * Step 11 — verify_admin_account
 * ============================================================================
 */

async function stepVerifyAdminAccount(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const apiUrl = `https://${state.identity.productDomain}/api/auth/me`;

    await retry(
      async () => {
        const resp = await fetch(apiUrl);
        if (resp.status === 401) {
          throw new Error(`/api/auth/me returned 401 — admin not configured`);
        }
        if (!resp.ok) {
          throw new Error(`/api/auth/me returned HTTP ${resp.status}`);
        }

        log.info("deploy", "verify_admin_account", `/api/auth/me: ${resp.status} OK`);
      },
      { maxAttempts: 5, delayMs: 10_000, backoffMultiplier: 1 },
    );
  });
}

/* ============================================================================
 * Step 12 — delivery_complete (19-check verification)
 * ============================================================================
 */

async function stepDeliveryComplete(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    log.info("deploy", "delivery_complete", "=== 19-CHECK DELIVERY VERIFICATION ===");
    const deliveryStart = Date.now();
    const checks: DeliveryCheck[] = [];

    // ── Check 1: GitHub repo exists ────────────────────────────────────────
    checks.push(await deliveryCheck(1, "github_repo_exists", async () => {
      if (!state.repoFullName) throw new Error("githubRepository not configured");
      const result = await GitHub.repoExists(state.repoFullName);
      requireSuccess(result, "repoExists");
      if (result.data === false) throw new Error(`repo not found: ${state.repoFullName}`);
    }));

    // ── Check 2: Vercel project exists ─────────────────────────────────────
    checks.push(await deliveryCheck(2, "vercel_project_exists", async () => {
      if (!state.projectId) throw new Error("projectId not set");
      const { status } = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(state.projectId)}`, {
        headers: { Authorization: `Bearer ${getContext().vercelToken}` },
      });
      if (status !== 200) throw new Error(`Vercel project lookup returned HTTP ${status}`);
    }));

    // ── Check 3: Deployment READY ──────────────────────────────────────────
    checks.push(await deliveryCheck(3, "deployment_ready", async () => {
      if (!state.deploymentId) throw new Error("deploymentId not set");
      const result = await Vercel.getDeploymentStatus(state.deploymentId);
      const data = requireSuccess(result, "getDeploymentStatus");
      if (data.readyState !== "READY") throw new Error(`Deployment state: ${data.readyState} (expected READY)`);
    }));

    // ── Check 4: Production deployment (PROMOTED) ──────────────────────────
    checks.push(await deliveryCheck(4, "production_deployment", async () => {
      if (!state.deploymentId) throw new Error("deploymentId not set");
      const result = await Vercel.getDeploymentStatus(state.deploymentId);
      const data = requireSuccess(result, "getDeploymentStatus");
      if (data.readyState !== "READY") throw new Error(`Deployment not READY: ${data.readyState}`);
      if (data.readySubstate !== "PROMOTED") throw new Error(`Deployment not PROMOTED: ${data.readySubstate ?? "undefined"}`);
    }));

    // ── Check 5: Custom domain bound ───────────────────────────────────────
    checks.push(await deliveryCheck(5, "custom_domain_bound", async () => {
      if (!state.projectId || !state.identity.productDomain) throw new Error("projectId or domain not set");
      const { status } = await fetch(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(state.projectId)}/domains`,
        { headers: { Authorization: `Bearer ${getContext().vercelToken}` } },
      );
      if (status !== 200) throw new Error(`Domain lookup returned HTTP ${status}`);
    }));

    // ── Check 6: HTTPS apex 200 ────────────────────────────────────────────
    checks.push(await deliveryCheck(6, "https_apex_200", async () => {
      const resp = await fetch(`https://${state.identity.productDomain}`, { redirect: "follow" });
      if (!resp.ok) throw new Error(`https://${state.identity.productDomain} returned HTTP ${resp.status}`);
    }));

    // ── Check 7: HTTPS www 200 ─────────────────────────────────────────────
    checks.push(await deliveryCheck(7, "https_www_200", async () => {
      const resp = await fetch(`https://www.${state.identity.productDomain}`, { redirect: "follow" });
      if (!resp.ok) throw new Error(`https://www.${state.identity.productDomain} returned HTTP ${resp.status}`);
    }));

    // ── Check 8: DNS configured ────────────────────────────────────────────
    checks.push(await deliveryCheck(8, "dns_configured", async () => {
      if (!state.zoneId) throw new Error("zoneId not set");
      const records = await Cloudflare.listDnsRecords(state.zoneId);
      requireSuccess(records, "listDnsRecords");
      const rootDomain = state.identity.productDomain.split(".").slice(-2).join(".");
      const apexName = state.identity.productDomain.replace(`.${rootDomain}`, "") || "@";
      const apexRecord = records.data!.find((r) => r.name === apexName && (r.type === "A" || r.type === "CNAME"));
      if (!apexRecord) throw new Error(`No DNS record for apex "${apexName}"`);
      const wwwRecord = records.data!.find((r) => r.name === "www" && r.type === "CNAME");
      if (!wwwRecord) throw new Error(`No DNS record for www`);
    }));

    // ── Check 9: Homepage status 200 + size ────────────────────────────────
    checks.push(await deliveryCheck(9, "homepage_status_and_size", async () => {
      const resp = await fetch(`https://${state.identity.productDomain}`, { redirect: "follow" });
      if (!resp.ok) throw new Error(`Homepage returned HTTP ${resp.status}`);
      const html = await resp.text();
      if (html.length < 5000) throw new Error(`Homepage too small: ${html.length} bytes (expected > 5000)`);
    }));

    // ── Check 11: Dashboard 200 ───────────────────────────────────────────
    checks.push(await deliveryCheck(11, "dashboard_200", async () => {
      const resp = await fetch(`https://${state.identity.productDomain}/dashboard`, { redirect: "follow" });
      if (!resp.ok) throw new Error(`/dashboard returned HTTP ${resp.status}`);
    }));

    // ── Check 12: Dashboard login works ────────────────────────────────────
    checks.push(await deliveryCheck(12, "dashboard_login_works", async () => {
      const resp = await fetch(`https://${state.identity.productDomain}/login`, { redirect: "follow" });
      if (!resp.ok) throw new Error(`/login returned HTTP ${resp.status}`);
      const html = await resp.text();
      if (!html.includes("login") && !html.includes("Login") && !html.includes("sign in")) {
        throw new Error("/login page does not appear to be a login form");
      }
    }));

    // ── Check 13: Admin account exists ─────────────────────────────────────
    checks.push(await deliveryCheck(13, "admin_account_exists", async () => {
      const resp = await fetch(`https://${state.identity.productDomain}/api/auth/me`);
      if (resp.status === 401) throw new Error("/api/auth/me returned 401 — admin not configured");
      if (!resp.ok) throw new Error(`/api/auth/me returned HTTP ${resp.status}`);
    }));

    // ── Check 14: Admin login succeeds ─────────────────────────────────────
    checks.push(await deliveryCheck(14, "admin_login_succeeds", async () => {
      const loginResp = await fetch(`https://${state.identity.productDomain}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: getContext().defaultAdminEmail,
          password: getContext().defaultAdminPassword,
        }),
        redirect: "manual",
      });
      if (loginResp.status !== 200 && loginResp.status !== 302) {
        throw new Error(`Admin login returned HTTP ${loginResp.status}`);
      }
    }));

    // ── Check 15: Admin dashboard loads ────────────────────────────────────
    checks.push(await deliveryCheck(15, "admin_dashboard_loads", async () => {
      const cookie = await (async () => {
        const loginResp = await fetch(`https://${state.identity.productDomain}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: getContext().defaultAdminEmail,
            password: getContext().defaultAdminPassword,
          }),
          redirect: "manual",
        });
        const setCookie = loginResp.headers.get("set-cookie");
        return setCookie ? setCookie.split(";")[0] : "";
      })();
      const resp = await fetch(`https://${state.identity.productDomain}/dashboard`, {
        headers: { Cookie: cookie },
        redirect: "follow",
      });
      if (!resp.ok) throw new Error(`Admin dashboard returned HTTP ${resp.status}`);
    }));

    // ── Check 16: No NOT_FOUND errors ─────────────────────────────────────
    checks.push(await deliveryCheck(16, "no_not_found_errors", async () => {
      const urls = [
        `https://${state.identity.productDomain}/about`,
        `https://${state.identity.productDomain}/products`,
        `https://${state.identity.productDomain}/contact`,
        `https://${state.identity.productDomain}/blog`,
        `https://${state.identity.productDomain}/login`,
        `https://${state.identity.productDomain}/dashboard`,
      ];
      for (const url of urls) {
        const resp = await fetch(url, { redirect: "follow" });
        if (resp.status === 404) throw new Error(`${url} returned 404 NOT_FOUND`);
        if (resp.status === 500) throw new Error(`${url} returned 500`);
        if (resp.status === 525) throw new Error(`${url} returned 525 SSL error`);
      }
    }));

    // ── Check 17: No 404 pages ────────────────────────────────────────────
    checks.push(await deliveryCheck(17, "no_404_pages", async () => {
      const criticalPaths = ["/about", "/products", "/contact", "/blog", "/login"];
      for (const p of criticalPaths) {
        const resp = await fetch(`https://${state.identity.productDomain}${p}`, { redirect: "follow" });
        if (resp.status === 404) throw new Error(`${p} returned 404`);
      }
    }));

    // ── Check 18: No 500 errors ───────────────────────────────────────────
    checks.push(await deliveryCheck(18, "no_500_errors", async () => {
      const paths = ["/about", "/products", "/contact", "/blog", "/login", "/dashboard"];
      for (const p of paths) {
        const resp = await fetch(`https://${state.identity.productDomain}${p}`, { redirect: "follow" });
        if (resp.status === 500) throw new Error(`${p} returned 500 Internal Server Error`);
      }
    }));

    // ── Check 19: No 525 SSL errors ───────────────────────────────────────
    checks.push(await deliveryCheck(19, "no_525_ssl_errors", async () => {
      const urls = [`https://${state.identity.productDomain}`, `https://www.${state.identity.productDomain}`];
      for (const url of urls) {
        const resp = await fetch(url, { redirect: "follow" });
        if (resp.status === 525) throw new Error(`${url} returned 525 SSL Handshake Failed`);
      }
    }));

    // ── Check 20: Cloudflare DNS verified ──────────────────────────────────
    checks.push(await deliveryCheck(20, "cloudflare_dns_verified", async () => {
      if (!state.zoneId) throw new Error("zoneId not set");
      const zone = await Cloudflare.getZone(state.identity.productDomain);
      requireSuccess(zone, "getZone");
      if (!zone.data) throw new Error(`Cloudflare zone not found for ${state.identity.productDomain}`);
    }));

    // ── Build Delivery Report ──────────────────────────────────────────────
    const deliveryDuration = Date.now() - deliveryStart;
    const passedCount = checks.filter((c) => c.passed).length;
    const failedChecks = checks.filter((c) => !c.passed);

    // Store checks and failure info in state for archive
    state.checks = checks;

    const report = buildDeliveryReport(checks, state, deliveryDuration);
    printDeliveryReport(report);

    if (failedChecks.length > 0) {
      state.failureReason =
        `${failedChecks.length}/${checks.length} checks failed: ` +
        failedChecks.map((c) => `${c.name}: ${c.message}`).join("; ");

      throw new Error(
        `DELIVERY INCOMPLETE — ${failedChecks.length}/${checks.length} checks failed:\n` +
        failedChecks.map((c) => `  [FAIL] ${c.name}: ${c.message}`).join("\n"),
      );
    }

    log.info("deploy", "delivery_complete", "DELIVERY COMPLETE — all 19 checks passed");
  });
}

/* ============================================================================
 * Legacy step — verify_repository (backward compat)
 * ============================================================================
 */

async function stepVerifyRepository(
  state: PipelineState,
  step: WorkflowStep,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, false, async () => {
    if (!state.repoFullName) {
      throw new Error("githubRepository is not configured");
    }

    const exists = await GitHub.repoExists(state.repoFullName);
    requireSuccess(exists, "repoExists");

    if (exists.data === false) {
      throw new Error(`repo does not exist: ${state.repoFullName}`);
    }
  });
}

/* ============================================================================
 * Legacy step — configure_dns (backward compat)
 * ============================================================================
 */

async function stepConfigureDns(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const zone = await Cloudflare.getZone(state.identity.productDomain);
    const zoneData = requireSuccess(zone, "getZone");
    state.zoneId = zoneData.zoneId;

    const rootDomain = state.identity.productDomain.split(".").slice(-2).join(".");
    const subdomain = state.identity.productDomain.replace(`.${rootDomain}`, "") || "@";

    await Cloudflare.addDnsRecord(state.zoneId, {
      type: "CNAME",
      name: subdomain,
      content: `${state.identity.productSlug}.vercel.app`,
      ttl: 300,
      proxied: true,
    });
  });
}

/* ============================================================================
 * Legacy step — verify_ssl (backward compat)
 * ============================================================================
 */

async function stepVerifySsl(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    if (!state.zoneId) {
      throw new Error("zoneId not set — configure_dns must run first");
    }

    const cfConfig = loadCloudflareConfig();

    if (cfConfig.ssl) {
      const result = await Cloudflare.configureSsl({
        domain: state.identity.productDomain,
        minTlsVersion: "1.2",
        sslMode: "full",
      });
      requireSuccess(result, "configureSsl");
    }

    const records = await Cloudflare.listDnsRecords(state.zoneId);
    requireSuccess(records, "listDnsRecords");
  });
}

/* ============================================================================
 * Skip options
 * ============================================================================
 */

function applySkipOptions(
  workflow: WorkflowDefinition,
  opts: DeployOptions,
): WorkflowDefinition {
  return {
    ...workflow,
    steps: workflow.steps.map((s) => {
      if (opts.skipGitHub && s.provider === "github") return { ...s, enabled: false };
      if (opts.skipCloudflare && s.provider === "cloudflare") return { ...s, enabled: false };
      if (opts.skipVercel && s.provider === "vercel") return { ...s, enabled: false };
      return s;
    }),
  };
}

/* ============================================================================
 * Main deploy function
 * ============================================================================
 */

export async function deploy(
  options?: Partial<DeployOptions>,
): Promise<DeploymentReport> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const start = Date.now();
  const state = buildInitialState();

  const workflow = applySkipOptions(loadWorkflow(), opts);

  const executor: WorkflowExecutor = {
    create_github: stepCreateGithub,
    push_code: stepPushCode,
    create_project: stepCreateProject,
    connect_github: stepConnectGithub,
    configure_env: stepConfigureEnv,
    deploy_project: stepDeployProject,
    bind_domain: stepBindDomain,
    configure_cloudflare_dns: stepConfigureCloudflareDns,
    configure_dns: stepConfigureDns,
    verify_dns: stepVerifyDns,
    verify_https: stepVerifyHttps,
    verify_homepage: stepVerifyHomepage,
    verify_dashboard_login: stepVerifyDashboardLogin,
    verify_admin_account: stepVerifyAdminAccount,
    delivery_complete: stepDeliveryComplete,
    verify_repository: stepVerifyRepository,
    verify_ssl: stepVerifySsl,
  };

  const result = await runWorkflow(workflow, executor, state, opts.dryRun);

  if (!result.passed) {
    log.error("deploy", "pipeline", `FAILED — ${result.failedSteps} step(s) failed`);
  }

  // Generate and archive delivery report (always, even on failure)
  const report = buildReport(result.results, state, opts.dryRun, start);

  if (!opts.dryRun && state.identity.productDomain) {
    try {
      generateReport({
        state,
        checks: state.checks,
        totalDuration: report.totalDuration,
        passed: report.passed,
        failureReason: state.failureReason ?? undefined,
        repairHistory: state.repairHistory,
      });
    } catch (archiveErr) {
      log.error("deploy", "archive", `Failed to write report: ${archiveErr}`);
    }
  }

  return report;
}

/* ============================================================================
 * Report
 * ============================================================================
 */

function buildReport(
  steps: StepResult[],
  state: PipelineState,
  dryRun: boolean,
  start: number,
): DeploymentReport {
  const report: DeploymentReport = {
    domain: state.identity.productDomain,
    environment: state.environment,
    timestamp: Date.now(),
    dryRun,
    steps,
    passed: steps.every((s) => s.passed),
    state,
    totalDuration: Date.now() - start,
  };

  const passed = steps.filter((s) => s.passed).length;
  const failed = steps.filter((s) => !s.passed).length;

  if (report.passed) {
    log.info("deploy", "report", `${passed}/${steps.length} steps passed (${report.totalDuration}ms)`);
  } else {
    log.error("deploy", "report", `${failed}/${steps.length} steps failed (${report.totalDuration}ms)`);
  }

  return report;
}

/* ============================================================================
 * Print report
 * ============================================================================
 */

export function printReport(report: DeploymentReport): void {
  console.log("");
  console.log("=".repeat(70));
  console.log("  DEPLOYMENT REPORT");
  console.log("=".repeat(70));
  console.log(`  Domain:      ${report.domain}`);
  console.log(`  Environment: ${report.environment}`);
  console.log(`  Mode:        ${report.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`  Timestamp:   ${new Date(report.timestamp).toISOString()}`);
  console.log(`  Status:      ${report.passed ? "ALL PASSED" : "FAILED"}`);
  console.log(`  Duration:    ${report.totalDuration}ms`);
  console.log("-".repeat(70));

  for (const step of report.steps) {
    const icon = step.passed ? "[PASS]" : "[FAIL]";
    const provider = step.provider.padEnd(12);
    const name = step.name.padEnd(30);
    console.log(`  ${icon} ${provider} ${name} ${step.message} (${step.duration}ms)`);
  }

  console.log("-".repeat(70));

  if (report.state.vercelProjectName) {
    console.log(`  Project:     ${report.state.vercelProjectName}`);
  }
  if (report.state.zoneId) {
    console.log(`  Zone ID:     ${report.state.zoneId}`);
  }
  if (report.state.projectId) {
    console.log(`  Project ID:  ${report.state.projectId}`);
  }
  if (report.state.deploymentId) {
    console.log(`  Deploy ID:   ${report.state.deploymentId}`);
  }
  if (report.state.deploymentUrl) {
    console.log(`  URL:         ${report.state.deploymentUrl}`);
  }

  console.log("=".repeat(70));
  console.log("");
}

/* ============================================================================
 * Delivery Report
 * ============================================================================
 */

function buildDeliveryReport(
  checks: DeliveryCheck[],
  state: PipelineState,
  totalDuration: number,
): DeliveryReport {
  const passedCount = checks.filter((c) => c.passed).length;
  const failedChecks = checks.filter((c) => !c.passed);

  const httpsCheck6 = checks.find((c) => c.name === "https_apex_200");
  const httpsCheck7 = checks.find((c) => c.name === "https_www_200");
  const httpsOk = (httpsCheck6?.passed ?? false) && (httpsCheck7?.passed ?? false);

  const dnsCheck = checks.find((c) => c.name === "dns_configured");
  const cfCheck = checks.find((c) => c.name === "cloudflare_dns_verified");
  const dnsOk = (dnsCheck?.passed ?? false) && (cfCheck?.passed ?? false);

  const buildCheck = checks.find((c) => c.name === "deployment_ready");
  const buildOk = buildCheck?.passed ?? false;

  return {
    deploymentUrl: state.deploymentUrl || "",
    productionUrl: `https://${state.identity.productDomain}`,
    dashboardUrl: `https://${state.identity.productDomain}/dashboard`,
    adminUsername: getContext().defaultAdminEmail,
    adminPassword: getContext().defaultAdminPassword,
    httpsStatus: httpsOk ? "ACTIVE" : "FAILED",
    dnsStatus: dnsOk ? "VERIFIED" : "FAILED",
    buildStatus: buildOk ? "READY" : "FAILED",
    deploymentTime: new Date().toISOString(),
    deliveryStatus: failedChecks.length === 0 ? "DELIVERY COMPLETE" : `DELIVERY INCOMPLETE (${failedChecks.length} failures)`,
    checks,
    passed: failedChecks.length === 0,
    totalDuration,
  };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function printDeliveryReport(report: DeliveryReport): void {
  console.log("");
  console.log("=".repeat(70));
  console.log("  DELIVERY REPORT — 19-CHECK VERIFICATION");
  console.log("=".repeat(70));

  const passedCount = report.checks.filter((c) => c.passed).length;
  const failedCount = report.checks.filter((c) => !c.passed).length;
  console.log(`  Status:       ${report.passed ? "DELIVERY COMPLETE" : "DELIVERY INCOMPLETE"}`);
  console.log(`  Checks:       ${passedCount}/19 passed, ${failedCount} failed`);
  console.log(`  Duration:     ${formatDuration(report.totalDuration)}`);
  console.log("-".repeat(70));

  console.log("  DEPLOYMENT DETAILS");
  console.log(`  Deployment:   ${report.deploymentUrl}`);
  console.log(`  Production:   ${report.productionUrl}`);
  console.log(`  Dashboard:    ${report.dashboardUrl}`);
  console.log(`  Admin User:   ${report.adminUsername}`);
  console.log(`  Admin Pass:   ${report.adminPassword}`);
  console.log("-".repeat(70));

  console.log("  STATUS CHECKS");
  console.log(`  HTTPS:        ${report.httpsStatus}`);
  console.log(`  DNS:          ${report.dnsStatus}`);
  console.log(`  Build:        ${report.buildStatus}`);
  console.log(`  Delivery:     ${report.deliveryStatus}`);
  console.log(`  Time:         ${report.deploymentTime}`);
  console.log("-".repeat(70));

  console.log("  19-CHECK VERIFICATION RESULTS");
  for (const check of report.checks) {
    const icon = check.passed ? "[PASS]" : "[FAIL]";
    const name = check.name.padEnd(30);
    const duration = check.duration > 0 ? `(${formatDuration(check.duration)})` : "";
    console.log(`  ${icon} #${String(check.step).padStart(2, "0")} ${name} ${check.message} ${duration}`);
  }

  console.log("=".repeat(70));

  if (!report.passed) {
    const failed = report.checks.filter((c) => !c.passed);
    console.log("");
    console.log("  FAILED CHECKS:");
    for (const c of failed) {
      console.log(`  [FAIL] #${String(c.step).padStart(2, "0")} ${c.name}: ${c.message}`);
    }
    console.log("");
  }

  console.log("");
}

/* ============================================================================
 * Export deliveryCheck for external use (workflowRunner)
 * ============================================================================
 */

export { deliveryCheck };
