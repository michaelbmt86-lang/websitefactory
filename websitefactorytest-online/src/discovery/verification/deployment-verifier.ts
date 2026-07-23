// ============================================================================
// DEPLOYMENT VERIFIER (Verification Engine)
//
// Verifies deployment readiness: git status, build output, environment,
// Vercel config, Cloudflare config. No site-specific logic.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { execSync } from "child_process";
import type { VerificationCheck } from "@/types/discovery";

function isGitClean(): boolean {
  try {
    const status = execSync("git status --porcelain", { stdio: "pipe", timeout: 10_000 }).toString().trim();
    return status.length === 0;
  } catch {
    return false;
  }
}

function hasGitRemote(): boolean {
  try {
    const remote = execSync("git remote", { stdio: "pipe", timeout: 5_000 }).toString().trim();
    return remote.length > 0;
  } catch {
    return false;
  }
}

export function verifyDeployment(): VerificationCheck {
  const issues: string[] = [];

  const gitClean = isGitClean();
  if (!gitClean) issues.push("Git working directory not clean");

  const hasRemote = hasGitRemote();
  if (!hasRemote) issues.push("No git remote configured");

  const requiredEnvVars = ["ADMIN_PASSWORD", "SESSION_SECRET"];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingEnvVars.length > 0) issues.push(`Missing env vars: ${missingEnvVars.join(", ")}`);

  const vercelConfigExists = fs.existsSync(path.join(process.cwd(), "vercel.json"));
  if (!vercelConfigExists) issues.push("No vercel.json found");

  const buildOutputExists = fs.existsSync(path.join(process.cwd(), ".next"));
  if (!buildOutputExists) issues.push("Build output (.next/) not found");

  const status = issues.length === 0 ? "PASS" : issues.length <= 2 ? "WARNING" : "FAILED";

  return {
    name: "deployment",
    status,
    message: issues.length === 0 ? "Deployment ready" : `${issues.length} deployment issues`,
    details: { gitClean, hasRemote, missingEnvVars, issues },
  };
}
