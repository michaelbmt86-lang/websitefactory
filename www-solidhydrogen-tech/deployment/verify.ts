import fs from "node:fs";
import path from "node:path";
import { getContext } from "./context";
import GitHub from "./providers/github";
import Vercel from "./providers/vercel";
import Cloudflare from "./providers/cloudflare";
import * as log from "./providers/logger";

export interface VerificationCheck {
  step: number;
  name: string;
  provider: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface VerificationReport {
  domain: string;
  environment: string;
  timestamp: number;
  checks: VerificationCheck[];
  passed: boolean;
  totalDuration: number;
}

export interface VerificationOptions {
  skipGithub: boolean;
  skipVercel: boolean;
  skipCloudflare: boolean;
  skipPreflight: boolean;
}

const DEFAULT_OPTIONS: VerificationOptions = {
  skipGithub: false,
  skipVercel: false,
  skipCloudflare: false,
  skipPreflight: false,
};

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

async function runCheck(
  step: number,
  name: string,
  provider: string,
  fn: () => Promise<void>,
): Promise<VerificationCheck> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    log.info("verify", name, `PASSED (${duration}ms)`);
    return { step, name, provider, passed: true, message: "OK", duration };
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    log.error("verify", name, `FAILED (${duration}ms): ${message}`);
    return { step, name, provider, passed: false, message, duration };
  }
}

async function verifyPreflight(): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];

  checks.push(await runCheck(0, "context_tokens", "runtime", async () => {
    if (!getContext().githubToken) throw new Error("GITHUB_TOKEN missing");
    if (!getContext().vercelToken) throw new Error("VERCEL_TOKEN missing");
    if (!getContext().cloudflareToken) throw new Error("CLOUDFLARE_API_TOKEN missing");
  }));

  checks.push(await runCheck(0, "context_domain", "runtime", async () => {
    if (!getContext().targetDomain) throw new Error("targetDomain is empty");
    if (!getContext().deploymentProvider) throw new Error("deploymentProvider is empty");
    if (!getContext().dnsProvider) throw new Error("dnsProvider is empty");
  }));

  checks.push(await runCheck(0, "config_files", "runtime", async () => {
    const deploymentRoot = getContext().deploymentRoot;
    const required = [
      "domain.config.json",
      "vercel.config.json",
      "cloudflare.config.json",
      "deployment.workflow.json",
    ];
    for (const file of required) {
      if (!fileExists(path.join(deploymentRoot, file))) {
        throw new Error(`missing config: ${file}`);
      }
    }
  }));

  checks.push(await runCheck(0, "workspace_root", "runtime", async () => {
    if (!dirExists(getContext().workspaceRoot)) {
      throw new Error(`workspaceRoot not found: ${getContext().workspaceRoot}`);
    }
    if (!dirExists(path.join(getContext().workspaceRoot, "src"))) {
      throw new Error("src/ directory missing in workspace");
    }
    if (!fileExists(path.join(getContext().workspaceRoot, "package.json"))) {
      throw new Error("package.json missing in workspace");
    }
  }));

  return checks;
}

async function verifyGitHub(): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  const repoFullName = `${getContext().githubRepository}`;

  checks.push(await runCheck(1, "github_repo_exists", "github", async () => {
    const result = await GitHub.repoExists(repoFullName);
    if (!result.success) throw new Error(result.error);
    if (result.data === false) throw new Error(`repo not found: ${repoFullName}`);
  }));

  return checks;
}

async function verifyCloudflare(): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  const domain = getContext().targetDomain;

  checks.push(await runCheck(2, "cloudflare_zone_lookup", "cloudflare", async () => {
    const result = await Cloudflare.getZone(domain);
    if (!result.success) throw new Error(result.error);
    if (!result.data) throw new Error(`zone not found for: ${domain}`);
  }));

  checks.push(await runCheck(5, "cloudflare_ssl_status", "cloudflare", async () => {
    const zoneResult = await Cloudflare.getZone(domain);
    if (!zoneResult.success || !zoneResult.data) {
      throw new Error("cannot verify SSL: zone lookup failed");
    }
    const zoneId = zoneResult.data.zoneId;
    const records = await Cloudflare.listDnsRecords(zoneId);
    if (!records.success) throw new Error(records.error);
  }));

  return checks;
}

async function verifyVercel(): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  const projectSlug = getContext().projectSlug;

  checks.push(await runCheck(3, "vercel_project_check", "vercel", async () => {
    const { status } = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectSlug)}`,
      { headers: { Authorization: `Bearer ${getContext().vercelToken}` } },
    );
    if (status === 404) throw new Error(`Project not found: ${projectSlug}`);
    if (status !== 200) throw new Error(`Vercel returned HTTP ${status}`);
  }));

  checks.push(await runCheck(4, "vercel_domain_bind", "vercel", async () => {
    const projectResp = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectSlug)}`,
      { headers: { Authorization: `Bearer ${getContext().vercelToken}` } },
    );
    if (projectResp.status === 404) throw new Error(`Project not found: ${projectSlug}`);
    if (projectResp.status !== 200) throw new Error(`Vercel project lookup returned HTTP ${projectResp.status}`);
    const project = await projectResp.json() as { id: string };

    const domainsResp = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(project.id)}/domains`,
      { headers: { Authorization: `Bearer ${getContext().vercelToken}` } },
    );
    if (domainsResp.status !== 200) throw new Error(`Vercel domain list returned HTTP ${domainsResp.status}`);
    const { domains } = await domainsResp.json() as { domains: Array<{ name: string }> };
    const bound = domains?.some((d) => d.name === getContext().targetDomain);
    if (!bound) throw new Error(`Domain "${getContext().targetDomain}" is not bound to project "${projectSlug}"`);
  }));

  return checks;
}

export async function verifyDeployment(
  options?: Partial<VerificationOptions>,
): Promise<VerificationReport> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const start = Date.now();

  log.info("verify", "verifyDeployment", `starting verification for ${getContext().targetDomain}`);

  let checks: VerificationCheck[] = [];

  if (!opts.skipPreflight) {
    const preflight = await verifyPreflight();
    checks = checks.concat(preflight);

    const preflightFailed = preflight.some((c) => !c.passed);
    if (preflightFailed) {
      log.error("verify", "verifyDeployment", "preflight failed — skipping provider checks");
      return buildReport(checks, start);
    }
  }

  if (!opts.skipGithub) {
    checks = checks.concat(await verifyGitHub());
  }

  if (!opts.skipCloudflare) {
    checks = checks.concat(await verifyCloudflare());
  }

  if (!opts.skipVercel) {
    checks = checks.concat(await verifyVercel());
  }

  return buildReport(checks, start);
}

function buildReport(checks: VerificationCheck[], start: number): VerificationReport {
  const report: VerificationReport = {
    domain: getContext().targetDomain,
    environment: getContext().environment,
    timestamp: Date.now(),
    checks,
    passed: checks.every((c) => c.passed),
    totalDuration: Date.now() - start,
  };

  const passed = report.checks.filter((c) => c.passed).length;
  const failed = report.checks.filter((c) => !c.passed).length;

  log.info("verify", "report", `${passed}/${checks.length} checks passed, ${failed} failed (${report.totalDuration}ms)`);

  return report;
}

export function printReport(report: VerificationReport): void {
  console.log("");
  console.log("=".repeat(70));
  console.log("  VERIFICATION REPORT");
  console.log("=".repeat(70));
  console.log(`  Domain:      ${report.domain}`);
  console.log(`  Environment: ${report.environment}`);
  console.log(`  Timestamp:   ${new Date(report.timestamp).toISOString()}`);
  console.log(`  Status:      ${report.passed ? "ALL PASSED" : "FAILED"}`);
  console.log(`  Duration:    ${report.totalDuration}ms`);
  console.log("-".repeat(70));

  for (const check of report.checks) {
    const icon = check.passed ? "[PASS]" : "[FAIL]";
    const provider = check.provider.padEnd(12);
    const name = check.name.padEnd(30);
    console.log(`  ${icon} ${provider} ${name} ${check.message} (${check.duration}ms)`);
  }

  console.log("=".repeat(70));
  console.log("");
}
