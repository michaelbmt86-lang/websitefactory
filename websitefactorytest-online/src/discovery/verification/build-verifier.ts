// ============================================================================
// BUILD VERIFIER (Verification Engine)
//
// Verifies build integrity: typecheck, lint, build status.
// Runs actual build commands via child_process and reports real results.
// No site-specific logic.
// ============================================================================

import { execSync } from "child_process";
import type { VerificationCheck } from "@/types/discovery";

function runCheck(name: string, command: string): { passed: boolean; message: string } {
  try {
    execSync(command, { stdio: "pipe", timeout: 120_000 });
    return { passed: true, message: "OK" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stderr = (err as { stderr?: Buffer })?.stderr?.toString() ?? "";
    const summary = stderr.split("\n").filter(Boolean).slice(0, 5).join(" | ");
    return { passed: false, message: summary || msg.slice(0, 200) };
  }
}

export function verifyBuild(): VerificationCheck {
  const checks: string[] = [];

  const typecheck = runCheck("typecheck", "npx tsc --noEmit");
  if (!typecheck.passed) checks.push(`TypeScript: ${typecheck.message}`);

  const lint = runCheck("lint", "npx next lint");
  if (!lint.passed) checks.push(`ESLint: ${lint.message}`);

  const build = runCheck("build", "npx next build");
  if (!build.passed) checks.push(`Build: ${build.message}`);

  const status = checks.length === 0 ? "PASS" : "FAILED";

  return {
    name: "build",
    status,
    message: checks.length === 0 ? "All build checks passed" : `Build issues: ${checks.join("; ")}`,
    details: { typecheck: typecheck.passed ? "PASS" : "FAIL", lint: lint.passed ? "PASS" : "FAIL", build: build.passed ? "PASS" : "FAIL", issues: checks },
  };
}
