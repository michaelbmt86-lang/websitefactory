// ============================================================================
// WEBSITE FACTORY ORCHESTRATOR v1.0
//
// Thin coordinator that calls existing engines in sequence.
// Owns NO business logic. Owns NO database access. Owns NO HTML parsing.
// Architecture Lock: ABSOLUTE.
// ============================================================================

import fs from "fs";
import path from "path";
import {
  discoverSite,
  discoverProducts,
  extractProductDetails,
  generateCms,
  runVerification,
} from "@/discovery";
import { deploy } from "../../deployment/deploy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface OrchestratorInput {
  siteUrl: string;
  domain: string;
  mode: string;
}

export interface StageResult {
  name: string;
  status: "success" | "failed" | "skipped";
  durationMs: number;
  error?: string;
}

export interface OrchestratorResult {
  siteUrl: string;
  domain: string;
  mode: string;
  stages: StageResult[];
  totalDurationMs: number;
  overallStatus: "success" | "partial" | "failed";
}

// ---------------------------------------------------------------------------
// Stage runner — measures duration, catches errors
// ---------------------------------------------------------------------------
async function runStage<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ result: T; stage: StageResult }> {
  const start = Date.now();
  try {
    const result = await fn();
    return {
      result,
      stage: { name, status: "success", durationMs: Date.now() - start },
    };
  } catch (err) {
    return {
      result: null as T,
      stage: {
        name,
        status: "failed",
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Domain config generator — produces deployment/domain.config.json from CLI input
// Monorepo Contract: github_repository is ALWAYS the single monorepo.
// ---------------------------------------------------------------------------
export function writeDomainConfig(siteUrl: string, domain: string): void {
  const deploymentDir = path.join(process.cwd(), "deployment");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const projectSlug = domain.replace(/\./g, "-");
  const config = {
    project_name: domain,
    project_slug: projectSlug,
    target_domain: domain,
    reference_website: siteUrl,
    github_repository: "michaelbmt86-lang/websitefactory",
    environment: "test",
    registrar: "namecheap",
    dns_provider: "cloudflare",
    deployment_provider: "vercel",
  };

  fs.writeFileSync(
    path.join(deploymentDir, "domain.config.json"),
    JSON.stringify(config, null, 2),
    "utf-8",
  );
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------
export async function runWebsiteFactory(
  input: OrchestratorInput,
): Promise<OrchestratorResult> {
  const { siteUrl, domain, mode } = input;
  const pipelineStart = Date.now();
  const stages: StageResult[] = [];
  let stopped = false;

  // Stage 1: Discovery
  const discovery = await runStage("discovery", () => discoverSite(siteUrl));
  stages.push(discovery.stage);
  if (discovery.stage.status === "failed") {
    stopped = true;
  }

  // Stage 2: Product Discovery
  if (!stopped) {
    const productDiscovery = await runStage("product-discovery", () =>
      discoverProducts(siteUrl),
    );
    stages.push(productDiscovery.stage);
    if (productDiscovery.stage.status === "failed") {
      stopped = true;
    }
  }

  // Stage 3: Detail Extraction
  if (!stopped) {
    const detailExtraction = await runStage("detail-extraction", () =>
      extractProductDetails(siteUrl),
    );
    stages.push(detailExtraction.stage);
    if (detailExtraction.stage.status === "failed") {
      stopped = true;
    }
  }

  // Stage 4: CMS Generator
  if (!stopped) {
    const cms = await runStage("cms-generator", () => generateCms(siteUrl));
    stages.push(cms.stage);
    if (cms.stage.status === "failed") {
      stopped = true;
    }
  }

  // Stage 5: Verification (always runs, even after earlier failures)
  const verification = await runStage("verification", () =>
    runVerification(siteUrl),
  );
  stages.push(verification.stage);

  // Stage 6: Delivery — Website Builder Runtime (always runs, even after earlier failures)
  // Generates domain config from CLI input, then invokes deployment pipeline.
  // The deployment pipeline encapsulates: GitHub, Vercel, Cloudflare, delivery report.
  if (!stopped) {
    const delivery = await runStage("delivery", async () => {
      writeDomainConfig(siteUrl, domain);
      return deploy({ dryRun: false, skipGitHub: false, skipCloudflare: false, skipVercel: false });
    });
    stages.push(delivery.stage);
  }

  // Mark skipped stages
  if (stopped) {
    const skippedNames = ["product-discovery", "detail-extraction", "cms-generator", "verification", "delivery"];
    for (const s of stages) {
      const idx = skippedNames.indexOf(s.name);
      if (idx !== -1) skippedNames.splice(idx, 1);
    }
    for (const name of skippedNames) {
      stages.push({ name, status: "skipped", durationMs: 0 });
    }
  }

  // Determine overall status
  const failedCount = stages.filter((s) => s.status === "failed").length;
  const successCount = stages.filter((s) => s.status === "success").length;
  let overallStatus: OrchestratorResult["overallStatus"];
  if (failedCount === 0) {
    overallStatus = "success";
  } else if (successCount === 0) {
    overallStatus = "failed";
  } else {
    overallStatus = "partial";
  }

  return {
    siteUrl,
    domain,
    mode,
    stages,
    totalDurationMs: Date.now() - pipelineStart,
    overallStatus,
  };
}
