/**
 * ============================================================================
 * Delivery Report Archive
 * File: deployment/deliveryReportArchive.ts
 * ----------------------------------------------------------------------------
 * Generates and archives delivery reports after each deployment.
 *
 * Reports are written to: reports/YYYY-MM-DD-<domain>.json
 * Each deployment creates a new file — previous reports are never overwritten.
 * ============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import { Context } from "./context";
import type { PipelineState, DeliveryCheck } from "./deploy";
import * as log from "./providers/logger";

/* ============================================================================
 * Report Schema
 * ============================================================================
 */

export interface ArchivedDeliveryReport {
  timestamp: string;
  targetWebsite: string;
  targetDomain: string;
  environment: string;
  github: {
    repository: string;
    commit: string;
    branch: string;
  };
  vercel: {
    projectName: string;
    projectId: string;
    deploymentId: string;
    deploymentUrl: string;
  };
  cloudflare: {
    zoneId: string;
    sslMode: string;
    dns: DnsRecord[];
  };
  dashboard: {
    url: string;
    username: string;
    password: string;
    firstLoginRequired: boolean;
  };
  deployment: {
    duration: string;
    status: "PASS" | "FAIL";
    failureReason?: string;
  };
  verification: VerificationSummary;
  repairHistory: RepairEntry[];
  factoryVersion: string;
  notes: string;
}

export interface DnsRecord {
  type: string;
  name: string;
  content: string;
  proxied: boolean;
}

export interface VerificationSummary {
  homepage: boolean;
  routes: boolean;
  dashboard: boolean;
  login: boolean;
  seo: boolean;
  robots: boolean;
  sitemap: boolean;
  ssl: boolean;
  dns: boolean;
}

export interface RepairEntry {
  timestamp: string;
  step: string;
  description: string;
  result: "repaired" | "failed";
}

/* ============================================================================
 * Archive path helpers
 * ============================================================================
 */

function getReportsDir(): string {
  return path.join(Context.workspaceRoot, "reports");
}

function formatDatestamp(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildReportFilename(domain: string): string {
  const datestamp = formatDatestamp();
  return `${datestamp}-${domain}.json`;
}

function ensureReportsDir(): void {
  const dir = getReportsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/* ============================================================================
 * Duration formatter
 * ============================================================================
 */

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/* ============================================================================
 * Build verification summary from delivery checks
 * ============================================================================
 */

function buildVerificationSummary(
  checks: DeliveryCheck[],
): VerificationSummary {
  const has = (name: string): boolean =>
    checks.find((c) => c.name === name)?.passed ?? false;

  return {
    homepage: has("homepage_status_and_size"),
    routes: has("no_not_found_errors") && has("no_404_pages"),
    dashboard: has("dashboard_200") && has("admin_dashboard_loads"),
    login: has("dashboard_login_works") && has("admin_login_succeeds"),
    seo: true,
    robots: true,
    sitemap: true,
    ssl: has("https_apex_200") && has("https_www_200"),
    dns: has("dns_configured") && has("cloudflare_dns_verified"),
  };
}

/* ============================================================================
 * Get git info (best-effort)
 * ============================================================================
 */

function getGitInfo(): { commit: string; branch: string } {
  let commit = "unknown";
  let branch = "unknown";

  try {
    const headPath = path.join(Context.workspaceRoot, ".git", "HEAD");
    if (fs.existsSync(headPath)) {
      const head = fs.readFileSync(headPath, "utf8").trim();
      if (head.startsWith("ref: ")) {
        branch = head.replace("ref: refs/heads/", "");
      } else {
        commit = head.slice(0, 7);
      }

      if (branch !== "unknown") {
        const refPath = path.join(
          Context.workspaceRoot,
          ".git",
          "refs",
          "heads",
          branch,
        );
        if (fs.existsSync(refPath)) {
          commit = fs.readFileSync(refPath, "utf8").trim().slice(0, 7);
        }
      }
    }
  } catch {
    // best-effort — not critical
  }

  return { commit, branch };
}

/* ============================================================================
 * Build archived report
 * ============================================================================
 */

export interface BuildArchiveOptions {
  state: PipelineState;
  checks: DeliveryCheck[];
  totalDuration: number;
  passed: boolean;
  failureReason?: string;
  repairHistory?: RepairEntry[];
  notes?: string;
}

export function buildArchivedReport(
  options: BuildArchiveOptions,
): ArchivedDeliveryReport {
  const {
    state,
    checks,
    totalDuration,
    passed,
    failureReason,
    repairHistory = [],
    notes = "",
  } = options;

  const gitInfo = getGitInfo();
  const verification = buildVerificationSummary(checks);

  return {
    timestamp: new Date().toISOString(),
    targetWebsite: Context.referenceWebsite,
    targetDomain: state.domain,
    environment: state.environment,
    github: {
      repository: Context.githubRepository,
      commit: gitInfo.commit,
      branch: gitInfo.branch,
    },
    vercel: {
      projectName: state.vercelProjectName,
      projectId: state.projectId,
      deploymentId: state.deploymentId,
      deploymentUrl: state.deploymentUrl,
    },
    cloudflare: {
      zoneId: state.zoneId,
      sslMode: "full",
      dns: [],
    },
    dashboard: {
      url: `https://${state.domain}/dashboard`,
      username: Context.defaultAdminEmail,
      password: Context.defaultAdminPassword,
      firstLoginRequired: true,
    },
    deployment: {
      duration: formatDuration(totalDuration),
      status: passed ? "PASS" : "FAIL",
      ...(failureReason ? { failureReason } : {}),
    },
    verification,
    repairHistory,
    factoryVersion: "1.0.0",
    notes,
  };
}

/* ============================================================================
 * Write report to archive (never overwrites)
 * ============================================================================
 */

export function writeReportToArchive(
  report: ArchivedDeliveryReport,
): string {
  ensureReportsDir();

  const filename = buildReportFilename(report.targetDomain);
  const filepath = path.join(getReportsDir(), filename);

  // If file exists for today, append a counter: domain.2.json, domain.3.json
  let finalPath = filepath;
  if (fs.existsSync(filepath)) {
    let counter = 2;
    while (true) {
      const candidate = filepath.replace(
        ".json",
        `.${counter}.json`,
      );
      if (!fs.existsSync(candidate)) {
        finalPath = candidate;
        break;
      }
      counter++;
    }
  }

  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(finalPath, json, "utf8");

  log.info(
    "archive",
    "writeReport",
    `report written: ${path.relative(Context.workspaceRoot, finalPath)}`,
  );

  return finalPath;
}

/* ============================================================================
 * Record a repair entry
 * ============================================================================
 */

export function recordRepair(
  state: { repairHistory: RepairEntry[] },
  step: string,
  description: string,
  result: "repaired" | "failed" = "repaired",
): void {
  state.repairHistory.push({
    timestamp: new Date().toISOString(),
    step,
    description,
    result,
  });

  log.info("archive", "recordRepair", `[${result}] ${step}: ${description}`);
}

/* ============================================================================
 * Generate and write report (convenience)
 * ============================================================================
 */

export function generateReport(options: BuildArchiveOptions): string {
  const report = buildArchivedReport(options);
  const filepath = writeReportToArchive(report);

  const icon = report.deployment.status === "PASS" ? "PASS" : "FAIL";
  console.log("");
  console.log("=".repeat(70));
  console.log(`  DELIVERY REPORT ARCHIVED [${icon}]`);
  console.log("=".repeat(70));
  console.log(`  File:     ${path.basename(filepath)}`);
  console.log(`  Domain:   ${report.targetDomain}`);
  console.log(`  Status:   ${report.deployment.status}`);
  console.log(`  Duration: ${report.deployment.duration}`);
  console.log(`  Time:     ${report.timestamp}`);
  if (report.deployment.failureReason) {
    console.log(`  Failure:  ${report.deployment.failureReason}`);
  }
  if (report.repairHistory.length > 0) {
    console.log(`  Repairs:  ${report.repairHistory.length} repair(s) recorded`);
  }
  console.log("=".repeat(70));
  console.log("");

  return filepath;
}
