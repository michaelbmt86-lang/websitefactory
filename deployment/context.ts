/**
 * ============================================================================
 * Website Factory Runtime v1
 * File: deployment/context.ts
 * ----------------------------------------------------------------------------
 * Runtime Context
 *
 * 所有 Deployment Runtime 共用的 Context
 *
 * Context 的职责：
 *
 * 1. 读取 .env
 * 2. 读取 deployment/*.json
 * 3. 合并配置
 * 4. 提供统一 Context
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
 * ============================================================================
 * Context Loader
 * ============================================================================
 */

export function loadContext(): DeploymentContext {

  const root = process.cwd();

  const deploymentRoot = path.join(root, "deployment");

  const domain = readJson(
    path.join(deploymentRoot, "domain.config.json")
  );

  const env = process.env;

  const ctx: DeploymentContext = {

    /**
     * Project
     */

    projectName:

      domain.project_name ||

      domain.projectName ||

      "websitefactory",

    projectSlug:

      domain.project_slug ||

      domain.projectSlug ||

      domain.project_name ||

      "websitefactory",

    targetDomain:

      domain.target_domain ||

      domain.domain ||

      "",

    referenceWebsite:

      domain.reference_website ||

      "",

    githubRepository:

      domain.github_repository ||

      "websitefactory",

    environment:

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
     * Dashboard
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

  return ctx;

}

/**
 * ============================================================================
 * Singleton
 * ============================================================================
 */

export const Context = loadContext();

export default Context;