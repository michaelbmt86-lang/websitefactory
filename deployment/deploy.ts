import fs from "node:fs";
import path from "node:path";
import { Context } from "./context";
import GitHub from "./providers/github";
import Vercel from "./providers/vercel";
import Cloudflare from "./providers/cloudflare";
import * as log from "./providers/logger";
import type { ProviderResult } from "./providers/types";
import { runWorkflow } from "./workflowRunner";
import type { WorkflowDefinition, WorkflowExecutor, WorkflowStep } from "./workflowRunner";

export interface PipelineState {
  domain: string;
  environment: string;
  repoFullName: string;
  projectSlug: string;
  zoneId: string;
  projectId: string;
  deploymentId: string;
  deploymentUrl: string;
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

export interface DeployOptions {
  dryRun: boolean;
  skipGitHub: boolean;
  skipCloudflare: boolean;
  skipVercel: boolean;
}

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
    path.join(Context.deploymentRoot, "vercel.config.json"),
  );
}

function loadCloudflareConfig(): CloudflareConfig {
  return readJson<CloudflareConfig>(
    path.join(Context.deploymentRoot, "cloudflare.config.json"),
  );
}

function loadWorkflow(): WorkflowDefinition {
  return readJson<WorkflowDefinition>(
    path.join(Context.deploymentRoot, "deployment.workflow.json"),
  );
}

function buildInitialState(): PipelineState {
  return {
    domain: Context.targetDomain,
    environment: Context.environment,
    repoFullName: Context.githubRepository,
    projectSlug: Context.projectSlug,
    zoneId: "",
    projectId: "",
    deploymentId: "",
    deploymentUrl: "",
  };
}

function requireSuccess<T>(result: ProviderResult<T>, stepName: string): T {
  if (!result.success) {
    throw new Error(`${stepName}: ${result.error}`);
  }
  if (result.data === undefined) {
    throw new Error(`${stepName}: returned no data`);
  }
  return result.data;
}

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

async function stepConfigureDns(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const cfConfig = loadCloudflareConfig();

    const zone = await Cloudflare.getZone(state.domain);
    const zoneData = requireSuccess(zone, "getZone");
    state.zoneId = zoneData.zoneId;

    const rootDomain = state.domain.split(".").slice(-2).join(".");
    const subdomain = state.domain.replace(`.${rootDomain}`, "") || "@";

    await Cloudflare.addDnsRecord(state.zoneId, {
      type: "CNAME",
      name: subdomain,
      content: `${state.projectSlug}.vercel.app`,
      ttl: 300,
      proxied: cfConfig.proxy,
    });

    if (cfConfig.dns_management) {
      const existing = await Cloudflare.listDnsRecords(state.zoneId);
      requireSuccess(existing, "listDnsRecords");
    }
  });
}

async function stepDeployProject(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    const vConfig = loadVercelConfig();

    const projectResult = await Vercel.createProject({
      name: state.projectSlug,
      framework: vConfig.framework,
      buildCommand: "",
      outputDirectory: ".next",
      installCommand: "",
      environmentVariables: {
        NODE_ENV: state.environment,
        DOMAIN: state.domain,
        ADMIN_EMAIL: Context.defaultAdminEmail,
      },
    });

    const project = requireSuccess(projectResult, "createProject");
    state.projectId = project.projectId;

    const envResult = await Vercel.setEnvironmentVariables(state.projectId, {
      NODE_ENV: state.environment,
      DOMAIN: state.domain,
      GITHUB_REPO: state.repoFullName,
    });
    requireSuccess(envResult, "setEnvironmentVariables");

    if (vConfig.auto_deploy) {
      const deployResult = await Vercel.deploy({
        projectId: state.projectId,
        gitRef: "main",
        name: `${state.projectSlug}-${state.environment}`,
        target: state.environment === "production" ? "production" : "preview",
      });

      const deploy = requireSuccess(deployResult, "deploy");
      state.deploymentId = deploy.deploymentId;
      state.deploymentUrl = deploy.url;
    }
  });
}

async function stepBindDomain(
  state: PipelineState,
  step: WorkflowStep,
  dryRun: boolean,
): Promise<StepResult> {
  return runStep(step.step, step.id, step.provider, dryRun, async () => {
    if (!state.projectId) {
      throw new Error("projectId not set — deploy_project must run first");
    }

    const result = await Vercel.bindDomain({
      domain: state.domain,
      projectId: state.projectId,
    });
    requireSuccess(result, "bindDomain");
  });
}

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
        domain: state.domain,
        minTlsVersion: "1.2",
        sslMode: "full",
      });
      requireSuccess(result, "configureSsl");
    }

    const records = await Cloudflare.listDnsRecords(state.zoneId);
    requireSuccess(records, "listDnsRecords");
  });
}

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

export async function deploy(
  options?: Partial<DeployOptions>,
): Promise<DeploymentReport> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const start = Date.now();
  const state = buildInitialState();

  const workflow = applySkipOptions(loadWorkflow(), opts);

  const executor: WorkflowExecutor = {
    verify_repository: stepVerifyRepository,
    configure_dns: stepConfigureDns,
    deploy_project: stepDeployProject,
    bind_domain: stepBindDomain,
    verify_ssl: stepVerifySsl,
  };

  const result = await runWorkflow(workflow, executor, state, opts.dryRun);

  return buildReport(result.results, state, opts.dryRun, start);
}

function buildReport(
  steps: StepResult[],
  state: PipelineState,
  dryRun: boolean,
  start: number,
): DeploymentReport {
  const report: DeploymentReport = {
    domain: state.domain,
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
    const name = step.name.padEnd(25);
    console.log(`  ${icon} ${provider} ${name} ${step.message} (${step.duration}ms)`);
  }

  console.log("-".repeat(70));

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
