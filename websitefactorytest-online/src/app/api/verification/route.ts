// ============================================================================
// VERIFICATION API ROUTE
//
// POST /api/verification — Run full verification pipeline
// GET  /api/verification — Get current verification state
// ============================================================================

import { NextResponse } from "next/server";
import db from "@/lib/db";
import type { VerificationReport, AuditReport, RepairReport, DeploymentReport } from "@/types/discovery";
import { runVerification } from "@/discovery/verification/verification-engine";

export async function GET() {
  try {
    const verification = db.prepare("SELECT * FROM verification_reports ORDER BY id DESC LIMIT 1").get() as VerificationReport | undefined;
    const audit = db.prepare("SELECT * FROM audit_reports ORDER BY id DESC LIMIT 1").get() as AuditReport | undefined;
    const repair = db.prepare("SELECT * FROM repair_reports ORDER BY id DESC LIMIT 1").get() as RepairReport | undefined;
    const deployment = db.prepare("SELECT * FROM deployment_reports ORDER BY id DESC LIMIT 1").get() as DeploymentReport | undefined;

    // Get latest audit issues for display
    let auditIssues: unknown[] = [];
    if (audit) {
      try { auditIssues = JSON.parse(audit.issues_json || "[]"); } catch { /* skip */ }
    }

    let repairActions: unknown[] = [];
    if (repair) {
      try { repairActions = JSON.parse(repair.actions_json || "[]"); } catch { /* skip */ }
    }

    return NextResponse.json({
      hasData: !!verification,
      verification: verification ? {
        siteUrl: verification.site_url,
        timestamp: verification.timestamp,
        totalChecks: verification.total_checks,
        passedChecks: verification.passed_checks,
        warningChecks: verification.warning_checks,
        failedChecks: verification.failed_checks,
        skippedChecks: verification.skipped_checks,
        overallStatus: verification.overall_status,
      } : null,
      audit: audit ? {
        siteUrl: audit.site_url,
        timestamp: audit.timestamp,
        totalIssues: audit.total_issues,
        errorCount: audit.error_count,
        warningCount: audit.warning_count,
        infoCount: audit.info_count,
        fixableCount: audit.fixable_count,
        overallStatus: audit.overall_status,
        issues: auditIssues.slice(0, 500),
      } : null,
      repair: repair ? {
        siteUrl: repair.site_url,
        timestamp: repair.timestamp,
        totalActions: repair.total_actions,
        fixedCount: repair.fixed_count,
        skippedCount: repair.skipped_count,
        failedCount: repair.failed_count,
        overallStatus: repair.overall_status,
        actions: repairActions.slice(0, 500),
      } : null,
      deployment: deployment ? {
        siteUrl: deployment.site_url,
        timestamp: deployment.timestamp,
        gitStatus: deployment.git_status,
        commitCount: deployment.commit_count,
        lastCommit: deployment.last_commit,
        buildSuccess: deployment.build_success,
        vercelStatus: deployment.vercel_status,
        cloudflareStatus: deployment.cloudflare_status,
        overallStatus: deployment.overall_status,
      } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try { new URL(url); } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const result = await runVerification(url);

    return NextResponse.json({
      success: true,
      result: {
        overallStatus: result.overallStatus,
        totalChecks: result.totalChecks,
        passedChecks: result.passedChecks,
        warningChecks: result.warningChecks,
        failedChecks: result.failedChecks,
        skippedChecks: result.skippedChecks,
        auditIssues: result.auditIssues,
        auditFixable: result.auditFixable,
        repairsAttempted: result.repairsAttempted,
        repairsFixed: result.repairsFixed,
        buildStatus: result.buildStatus,
        deploymentStatus: result.deploymentStatus,
        verificationTimeMs: result.verificationTimeMs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
