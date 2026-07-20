/**
 * ============================================================================
 * Website Factory Runtime v1
 * File: deployment/context.ts
 * ----------------------------------------------------------------------------
 * Runtime Context
 *
 * All Deployment Runtime 共用的 Context
 *
 * Context 的职责：
 *
 * 1. Read deployment-manifest.json (CMS Generator output, if available)
 * 2. Read .env
 * 3. Read deployment/*.json
 * 4. Merge configuration (manifest overrides domain.config.json where present)
 * 5. Provide unified Context
 *
 * Pipeline Contract:
 *   INPUT:  docs/discovery/deployment-manifest.json (from CMS Generator)
 *           deployment/domain.config.json (static config)
 *           Environment variables (tokens, passwords)
 *   OUTPUT: DeploymentContext (consumed by deploy.ts, verify.ts, providers)
 *
 * verify.ts
 * deploy.ts
 * github.ts
 * vercel.ts
 * cloudflare.ts
 *
 * 全部只读取 Context
 *
 * ============================================================================
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Deployment Manifest type — matches the output of CMS Generator
 */
interface DeploymentManifest {
  siteUrl: string;
  generatedAt: string;
  projectName: string;
  projectSlug: string;
  targetDomain: string;
  environment: string;
  artifacts: Record<string, string>;
  summary: Record<string, number>;
}

export interface DeploymentContext {

  /**
   * Project
   */

  projectName: string;

  projectSlug: string;

  targetDomain: string;

  referenceWebsite: string;

  githubRepository: string;

  environment: string;

  /**
   * Provider
   */

  registrar: string;

  dnsProvider: string;

  deploymentProvider: string;

  /**
   * Runtime
   */

  workspaceRoot: string;

  deploymentRoot: string;

  /**
   * Tokens
   */

  githubToken: string;

  vercelToken: string;

  cloudflareToken: string;

  geminiKey: string;

  firecrawlKey: string;

  /**
   * Default Dashboard
   */

  defaultAdminEmail: string;

  defaultAdminPassword: string;

}

/**
 * ============================================================================
 * Helpers
 * ============================================================================
 */

function readJson(file: string): any {

  return JSON.parse(
    fs.readFileSync(file, "utf8")
  );

}

function required(value: string | undefined, name: string): string {

  if (!value || value.trim() === "") {

    throw new Error(`${name} is missing.`);

  }

  return value;

}

/**
 * Try to read the deployment manifest written by CMS Generator.
 * Returns null if the file doesn't exist.
 */
function readDeploymentManifest(): DeploymentManifest | null {
  const manifestPath = path.join(process.cwd(), "docs", "discovery", "deployment-manifest.json");
  try {
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as DeploymentManifest;
    }
  } catch {
    // Manifest corrupted or unreadable — fall back to domain.config.json
  }
  return null;
}

/**
 * ============================================================================
 * Context Loader
 * ============================================================================
 */

export function loadContext(): DeploymentContext {

  const root = process.cwd();

  const deploymentRoot = path.join(root, "deployment");

  // 1. Read deployment manifest (CMS Generator output, if available)
  const manifest = readDeploymentManifest();

  // 2. Read domain.config.json (static config)
  const domain = readJson(
    path.join(deploymentRoot, "domain.config.json")
  );

  const env = process.env;

  // 3. Merge: manifest values override domain.config.json where present
  const ctx: DeploymentContext = {

    /**
     * Project
     */

    projectName:

      manifest?.projectName ||

      domain.project_name ||

      domain.projectName ||

      "websitefactory",

    projectSlug:

      manifest?.projectSlug ||

      domain.project_slug ||

      domain.projectSlug ||

      domain.project_name ||

      "websitefactory",

    targetDomain:

      manifest?.targetDomain ||

      domain.target_domain ||

      domain.domain ||

      "",

    referenceWebsite:

      manifest?.siteUrl ||

      domain.reference_website ||

      "",

    githubRepository:

      domain.github_repository ||

      "websitefactory",

    environment:

      manifest?.environment ||

      domain.environment ||

      "test",

    /**
     * Provider
     */

    registrar:

      domain.registrar ||

      "namecheap",

    dnsProvider:

      domain.dns_provider ||

      "cloudflare",

    deploymentProvider:

      domain.deployment_provider ||

      "vercel",

    /**
     * Runtime
     */

    workspaceRoot: root,

    deploymentRoot,

    /**
     * Tokens
     */

    githubToken:

      required(env.GITHUB_TOKEN, "GITHUB_TOKEN"),

    vercelToken:

      required(env.VERCEL_TOKEN, "VERCEL_TOKEN"),

    cloudflareToken:

      required(env.CLOUDFLARE_API_TOKEN, "CLOUDFLARE_API_TOKEN"),

    geminiKey:

      env.GEMINI_API_KEY || "",

    firecrawlKey:

      env.FIRECRAWL_API_KEY || "",

    /**
     * Default Dashboard
     */

    defaultAdminEmail:

      env.DEFAULT_DASHBOARD_EMAIL ||

      "michaelbmt86@gmail.com",

    defaultAdminPassword:

      env.DEFAULT_DASHBOARD_PASSWORD || "",

  };

  if (!ctx.defaultAdminPassword && ctx.environment === "production") {
    throw new Error("DEFAULT_DASHBOARD_PASSWORD is required in production");
  }

  // Log manifest availability
  if (manifest) {
    console.log("[context] Loaded deployment manifest from CMS Generator");
    console.log(`[context] Site: ${manifest.siteUrl} | Generated: ${manifest.generatedAt}`);
  }

  return ctx;

}

/**
 * ============================================================================
 * Lazy Singleton
 *
 * IMPORTANT: loadContext() must NOT run at import time.
 * The old `export const Context = loadContext()` executed immediately when
 * any file imported Context, crashing the entire pipeline before Stage 1.
 * getContext() defers initialization until first call.
 * ============================================================================
 */

let _ctx: DeploymentContext | null = null;

export function getContext(): DeploymentContext {
  if (_ctx === null) {
    _ctx = loadContext();
  }
  return _ctx;
}
