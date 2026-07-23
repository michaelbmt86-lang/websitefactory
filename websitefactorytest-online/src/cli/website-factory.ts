#!/usr/bin/env node
// ============================================================================
// WEBSITE FACTORY CLI v1.0
//
// Thin CLI entry point. Parses arguments, validates, calls orchestrator,
// prints results. Contains NO business logic.
// ============================================================================

import "dotenv/config";
import { runWebsiteFactory } from "@/orchestrator/website-factory-orchestrator";
import type { OrchestratorInput } from "@/orchestrator/website-factory-orchestrator";
import { createProjectIdentity } from "../../deployment/types/identity";

// ---------------------------------------------------------------------------
// Global error handlers — ensure fatal errors are always visible
// ---------------------------------------------------------------------------
process.on("unhandledRejection", (reason) => {
  console.error("[website-factory] Unhandled rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("[website-factory] Uncaught exception:", err);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Argument parser — supports Key=Value (no dashes)
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of argv.slice(2)) {
    const eqIdx = arg.indexOf("=");
    if (eqIdx !== -1) {
      args[arg.slice(0, eqIdx)] = arg.slice(eqIdx + 1);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Validator — validates raw parsed args before identity construction
// ---------------------------------------------------------------------------
function validateArgs(raw: Record<string, string>): string[] {
  const errors: string[] = [];
  const siteUrl = raw["Target"] ?? "";
  const domain = raw["Domain"] ?? "";
  const mode = raw["Mode"] ?? "";

  if (!siteUrl || siteUrl.trim().length === 0) {
    errors.push("Target is required");
  }
  if (!domain || domain.trim().length === 0) {
    errors.push("Domain is required");
  }
  if (!mode || mode.trim().length === 0) {
    errors.push("Mode is required");
  }
  if (siteUrl) {
    try {
      new URL(siteUrl);
    } catch {
      errors.push("Target must be a valid URL");
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const raw = parseArgs(process.argv);

  // Validate raw args BEFORE constructing identity
  const errors = validateArgs(raw);
  if (errors.length > 0) {
    console.error("[website-factory] Validation failed:");
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  // Construct identity — safe now that inputs are validated
  const identity = createProjectIdentity(raw["Target"]!, raw["Domain"]!);

  const input: OrchestratorInput = {
    siteUrl: raw["Target"]!,
    domain: raw["Domain"]!,
    mode: raw["Mode"]!,
    identity,
  };

  // Print configuration
  console.log("[website-factory] Starting pipeline");
  console.log(`  Target:  ${input.siteUrl}`);
  console.log(`  Domain:  ${input.domain}`);
  console.log(`  Mode:    ${input.mode}`);
  console.log();

  // Run orchestrator
  const result = await runWebsiteFactory(input);

  // Print summary
  console.log();
  console.log("[website-factory] Pipeline complete");
  console.log(`  Overall Status: ${result.overallStatus}`);
  console.log(`  Total Duration: ${result.totalDurationMs}ms`);
  console.log();
  console.log("  Stages:");
  for (const stage of result.stages) {
    const icon = stage.status === "success" ? "OK" : stage.status === "failed" ? "FAIL" : "SKIP";
    const duration = stage.status === "skipped" ? "" : ` (${stage.durationMs}ms)`;
    const error = stage.error ? ` — ${stage.error}` : "";
    console.log(`    [${icon}] ${stage.name}${duration}${error}`);
  }

  // Exit code
  process.exit(result.overallStatus === "failed" ? 1 : 0);
}

main().catch((err) => {
  console.error("[website-factory] Fatal error:", err);
  process.exit(1);
});
