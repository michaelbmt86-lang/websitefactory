// ============================================================================
// WEBSITE BUILDER — VERIFICATION ENGINE (Stage 5b)
//
// Pipeline Contract:
//   INPUT:  SQLite tables (site_urls, product_urls, extracted_products,
//           cms_pages, cms_brands, cms_collections, etc.) written by
//           upstream stages.
//   OUTPUT: Verification artifacts written to:
//     - SQLite: verification_reports, audit_reports, repair_reports
//     - docs/discovery/verification-report.json
//     - docs/discovery/audit-report.json
//     - docs/discovery/repair-report.json
//
// Orchestrates the complete verification pipeline:
//   Verify → Audit → Repair
//
// This stage consumes NO external resources (no fetch, no APIs).
// It is a pure SQLite→SQLite+filesystem transform.
// ============================================================================

import fs from "fs";
import path from "path";
import db from "@/lib/db";
import type { VerificationCheck, VerificationResult } from "@/types/discovery";
import { verifyPages } from "./page-verifier";
import { verifyProducts } from "./product-verifier";
import { verifyMedia } from "./media-verifier";
import { verifyLinks } from "./link-verifier";
import { verifySeo } from "./seo-verifier";
import { verifySchema } from "./schema-verifier";
import { verifyNavigation } from "./navigation-verifier";
import { verifyBuild } from "./build-verifier";
import { verifyDeployment } from "./deployment-verifier";
import { verifySqlite } from "./sqlite-verifier";
import { verifyUrlCoverage, verifyProductCoverage, verifyCmsCoverage } from "./coverage-verifier";
import { runAudit } from "./audit-engine";
import { runRepairs } from "./repair-engine";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function runVerification(siteUrl: string): Promise<VerificationResult> {
  const startTimeMs = Date.now();
  console.log("[verification] Starting verification for", siteUrl);

  // ── STEP 1: VERIFY ──
  console.log("[verification] Running verifiers...");
  const checks: VerificationCheck[] = [
    verifyPages(),
    verifyProducts(),
    verifyMedia(),
    verifyLinks(),
    verifySeo(),
    verifySchema(),
    verifyNavigation(),
    verifyBuild(),
    verifyDeployment(),
    verifySqlite(),
    verifyUrlCoverage(),
    verifyProductCoverage(),
    verifyCmsCoverage(),
  ];

  const passedChecks = checks.filter(c => c.status === "PASS").length;
  const warningChecks = checks.filter(c => c.status === "WARNING").length;
  const failedChecks = checks.filter(c => c.status === "FAILED").length;
  const skippedChecks = checks.filter(c => c.status === "SKIPPED").length;
  const overallStatus = failedChecks > 0 ? "FAILED" : warningChecks > 0 ? "WARNING" : "PASS";

  console.log(`[verification] Checks: ${passedChecks} PASS, ${warningChecks} WARN, ${failedChecks} FAIL, ${skippedChecks} SKIP`);

  // Save verification report
  const vrStmt = db.prepare(`
    INSERT INTO verification_reports (site_url, timestamp, total_checks, passed_checks, warning_checks, failed_checks, skipped_checks, overall_status, pages_json, products_json, media_json, links_json, seo_json, schema_json, navigation_json, build_json, deployment_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  vrStmt.run(
    siteUrl, new Date().toISOString(), checks.length, passedChecks, warningChecks, failedChecks, skippedChecks, overallStatus,
    JSON.stringify(checks.find(c => c.name === "pages")),
    JSON.stringify(checks.find(c => c.name === "products")),
    JSON.stringify(checks.find(c => c.name === "media")),
    JSON.stringify(checks.find(c => c.name === "links")),
    JSON.stringify(checks.find(c => c.name === "seo")),
    JSON.stringify(checks.find(c => c.name === "schema")),
    JSON.stringify(checks.find(c => c.name === "navigation")),
    JSON.stringify(checks.find(c => c.name === "build")),
    JSON.stringify(checks.find(c => c.name === "deployment")),
  );

  // ── STEP 2: AUDIT ──
  console.log("[verification] Running audit...");
  const auditResult = runAudit();
  console.log(`[verification] Audit: ${auditResult.totalIssues} issues (${auditResult.errorCount} errors, ${auditResult.fixableCount} fixable)`);

  const auditStatus = auditResult.errorCount > 0 ? "FAILED" : auditResult.warningCount > 0 ? "WARNING" : "PASS";

  const arStmt = db.prepare(`
    INSERT INTO audit_reports (site_url, timestamp, total_issues, error_count, warning_count, info_count, fixable_count, overall_status, issues_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  arStmt.run(
    siteUrl, new Date().toISOString(), auditResult.totalIssues, auditResult.errorCount,
    auditResult.warningCount, auditResult.infoCount, auditResult.fixableCount, auditStatus,
    JSON.stringify(auditResult.issues)
  );

  // ── STEP 3: REPAIR ──
  console.log("[verification] Running repairs...");
  const repairResult = runRepairs(auditResult.issues);
  console.log(`[verification] Repairs: ${repairResult.fixedCount} fixed, ${repairResult.skippedCount} skipped, ${repairResult.failedCount} failed`);

  const repairStatus = repairResult.failedCount > 0 ? "FAILED" : repairResult.fixedCount > 0 ? "PASS" : "SKIPPED";

  const rrStmt = db.prepare(`
    INSERT INTO repair_reports (site_url, timestamp, total_actions, fixed_count, skipped_count, failed_count, overall_status, actions_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  rrStmt.run(
    siteUrl, new Date().toISOString(), repairResult.totalActions, repairResult.fixedCount,
    repairResult.skippedCount, repairResult.failedCount, repairStatus,
    JSON.stringify(repairResult.actions)
  );

  // ── STEP 4: Write output files ──
  const outDir = path.join(process.cwd(), "docs", "discovery");
  ensureDir(outDir);

  fs.writeFileSync(
    path.join(outDir, "verification-report.json"),
    JSON.stringify({ siteUrl, timestamp: new Date().toISOString(), checks, overallStatus }, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(outDir, "audit-report.json"),
    JSON.stringify({ siteUrl, timestamp: new Date().toISOString(), ...auditResult }, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(outDir, "repair-report.json"),
    JSON.stringify({ siteUrl, timestamp: new Date().toISOString(), ...repairResult }, null, 2),
    "utf-8"
  );

  const endTimeMs = Date.now();

  const result: VerificationResult = {
    siteUrl,
    startTimeMs,
    endTimeMs,
    verificationTimeMs: endTimeMs - startTimeMs,
    totalChecks: checks.length,
    passedChecks,
    warningChecks,
    failedChecks,
    skippedChecks,
    overallStatus,
    auditIssues: auditResult.totalIssues,
    auditFixable: auditResult.fixableCount,
    repairsAttempted: repairResult.totalActions,
    repairsFixed: repairResult.fixedCount,
    buildStatus: checks.find(c => c.name === "build")?.status || "SKIPPED",
    deploymentStatus: checks.find(c => c.name === "deployment")?.status || "SKIPPED",
  };

  console.log("[verification] Complete:", {
    status: result.overallStatus,
    checks: `${result.passedChecks}/${result.totalChecks}`,
    audit: `${result.auditIssues} issues`,
    repairs: `${result.repairsFixed}/${result.repairsAttempted}`,
    time: `${result.verificationTimeMs}ms`,
  });

  return result;
}
