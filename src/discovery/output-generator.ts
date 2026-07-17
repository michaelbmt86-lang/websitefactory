// ============================================================================
// OUTPUT GENERATOR (Site Discovery Engine)
//
// Generates site-map.json, url-graph.json, crawl-summary.json, and
// delivery-report.json from discovery data. Reusable — no site-specific logic.
// ============================================================================

import fs from "fs";
import path from "path";
import db from "@/lib/db";
import type { SiteUrl, ProductUrl, ExtractedProduct, VerificationReport, AuditReport, RepairReport } from "@/types/discovery";
import type {
  SiteMapOutput,
  UrlGraphOutput,
  CrawlSummaryOutput,
  DeliveryReportOutput,
} from "./output-types";
import { buildUrlGraph } from "./url-graph";
import { getExtractionMetricsSummary } from "./extraction/extraction-manager";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getOutputDir(): string {
  return path.join(process.cwd(), "docs", "discovery");
}

export function generateSiteMapJson(siteUrl: string): SiteMapOutput {
  const urls = db.prepare("SELECT * FROM site_urls ORDER BY depth, priority DESC").all() as SiteUrl[];

  const output: SiteMapOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalUrls: urls.length,
    urls: urls.map(u => ({
      url: u.url,
      slug: u.slug,
      depth: u.depth,
      pageType: u.page_type,
      status: u.status,
      priority: u.priority,
      title: u.title,
      parentUrl: u.parent_url,
    })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "site-map.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateUrlGraphJson(siteUrl: string): UrlGraphOutput {
  const urls = db.prepare("SELECT * FROM site_urls").all() as SiteUrl[];
  const graph = buildUrlGraph(urls, siteUrl);

  const output: UrlGraphOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    root: graph.root,
    maxDepth: graph.maxDepth,
    totalNodes: graph.totalUrls,
    totalEdges: graph.edges.length,
    nodes: Object.values(graph.nodes).map(n => ({
      id: n.id,
      url: n.url,
      slug: n.slug,
      depth: n.depth,
      parent: n.parent,
      pageType: n.pageType,
      status: n.status,
      priority: n.priority,
      discoveredBy: n.discoveredBy,
      childCount: n.children.length,
    })),
    edges: graph.edges,
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "url-graph.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateCrawlSummary(siteUrl: string): CrawlSummaryOutput {
  const urls = db.prepare("SELECT * FROM site_urls").all() as SiteUrl[];

  const totalUrls = urls.length;
  const crawledUrls = urls.filter(u => u.status === "crawled").length;
  const brokenUrls = urls.filter(u => u.status === "broken").length;
  const skippedUrls = urls.filter(u => u.status === "skipped").length;
  const discoveredUrls = urls.filter(u => u.status === "discovered").length;

  const maxDepth = Math.max(...urls.map(u => u.depth), 0);
  const avgDepth = totalUrls > 0
    ? urls.reduce((sum, u) => sum + u.depth, 0) / totalUrls
    : 0;

  // Page type breakdown
  const urlsByType: Record<string, number> = {};
  for (const u of urls) {
    urlsByType[u.page_type] = (urlsByType[u.page_type] || 0) + 1;
  }

  // Status breakdown
  const urlsByStatus: Record<string, number> = {};
  for (const u of urls) {
    urlsByStatus[u.status] = (urlsByStatus[u.status] || 0) + 1;
  }

  // Depth distribution
  const depthDistribution: Record<string, number> = {};
  for (const u of urls) {
    depthDistribution[String(u.depth)] = (depthDistribution[String(u.depth)] || 0) + 1;
  }

  // Discovery sources
  const discoverySources: Record<string, number> = {};
  for (const u of urls) {
    const sources = u.discovered_by.split(",");
    for (const s of sources) {
      const trimmed = s.trim();
      discoverySources[trimmed] = (discoverySources[trimmed] || 0) + 1;
    }
  }

  // Top pages by priority
  const topPages = urls
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 20)
    .map(u => ({
      url: u.url,
      pageType: u.page_type as never,
      depth: u.depth,
    }));

  const output: CrawlSummaryOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalUrls,
    crawledUrls,
    brokenUrls,
    skippedUrls,
    discoveredUrls,
    maxDepth,
    averageDepth: Math.round(avgDepth * 100) / 100,
    urlsByType: urlsByType as Record<string, number>,
    urlsByStatus,
    depthDistribution,
    discoverySources,
    topPages,
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "crawl-summary.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateDeliveryReport(
  siteUrl: string,
  checks: {
    typecheck: "PASS" | "FAIL";
    lint: "PASS" | "FAIL";
    build: "PASS" | "FAIL";
    discovery: "PASS" | "FAIL";
    productDiscovery: "PASS" | "FAIL";
    detailExtraction: "PASS" | "FAIL";
    cmsGenerator: "PASS" | "FAIL";
    verification: "PASS" | "FAIL";
    dashboard: "PASS" | "FAIL";
  }
): DeliveryReportOutput {
  const urls = db.prepare("SELECT * FROM site_urls").all() as SiteUrl[];
  const totalUrls = urls.length;

  const categories = urls.filter(u => u.page_type === "Category").length;
  const brokenUrls = urls.filter(u => u.status === "broken").length;
  const crawledUrls = urls.filter(u => u.status === "crawled").length;
  const discoveryCoverage = totalUrls > 0 ? Math.round((crawledUrls / totalUrls) * 100) : 0;

  const maxDepth = Math.max(...urls.map(u => u.depth), 0);
  const avgDepth = totalUrls > 0
    ? urls.reduce((sum, u) => sum + u.depth, 0) / totalUrls
    : 0;

  const distribution: Record<string, number> = {};
  for (const u of urls) {
    distribution[String(u.depth)] = (distribution[String(u.depth)] || 0) + 1;
  }

  const pageTypeBreakdown: Record<string, number> = {};
  for (const u of urls) {
    pageTypeBreakdown[u.page_type] = (pageTypeBreakdown[u.page_type] || 0) + 1;
  }

  const allChecksPass = Object.values(checks).every(v => v === "PASS");

  // Product Discovery metrics
  const productUrls = db.prepare("SELECT * FROM product_urls").all() as ProductUrl[];
  const totalProducts = productUrls.filter(p => !p.is_duplicate).length;
  const productCategories = new Set(productUrls.map(p => p.category)).size;
  const duplicateProducts = productUrls.filter(p => p.is_duplicate).length;
  const brokenProducts = productUrls.filter(p => p.status === "broken").length;
  const crawledProducts = productUrls.filter(p => p.status === "crawled").length;
  const productCoverage = productUrls.length > 0 ? Math.round((crawledProducts / productUrls.length) * 100) : 0;

  const productsByCategory: Record<string, number> = {};
  for (const p of productUrls) {
    productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
  }

  // Detail Extraction metrics
  const extractedProducts = db.prepare("SELECT * FROM extracted_products WHERE status = 'completed'").all() as ExtractedProduct[];
  const totalExtracted = extractedProducts.length;
  let totalImages = 0;
  let totalDownloads = 0;
  let totalSpecs = 0;
  let seoCount = 0;
  let schemaCount = 0;
  for (const ep of extractedProducts) {
    try { totalImages += JSON.parse(ep.images_json || "[]").length; } catch { /* skip */ }
    try { totalDownloads += JSON.parse(ep.downloads_json || "[]").length; } catch { /* skip */ }
    try { totalSpecs += JSON.parse(ep.specifications_json || "[]").length; } catch { /* skip */ }
    try {
      const seo = JSON.parse(ep.seo_json || "{}");
      if (seo.title || seo.metaDescription) seoCount++;
    } catch { /* skip */ }
    try {
      const schema = JSON.parse(ep.schema_json || "[]");
      if (schema.length > 0) schemaCount++;
    } catch { /* skip */ }
  }
  const failedExtractions = db.prepare("SELECT COUNT(*) as count FROM extracted_products WHERE status = 'failed'").get() as { count: number };
  const totalProductUrlsForRate = totalProducts || 1;
  const extractionSuccessRate = Math.round((totalExtracted / totalProductUrlsForRate) * 100);
  const seoCoverage = totalExtracted > 0 ? Math.round((seoCount / totalExtracted) * 100) : 0;
  const schemaCoveragePct = totalExtracted > 0 ? Math.round((schemaCount / totalExtracted) * 100) : 0;

  const output: DeliveryReportOutput = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    discovery: {
      totalUrls,
      categories,
      discoveryCoverage,
      brokenUrls,
      depthStatistics: {
        maxDepth,
        averageDepth: Math.round(avgDepth * 100) / 100,
        distribution,
      },
      pageTypeBreakdown,
    },
    productDiscovery: {
      totalProducts,
      totalCategories: productCategories,
      duplicateCount: duplicateProducts,
      brokenProductUrls: brokenProducts,
      coveragePercent: productCoverage,
      discoveryTimeMs: 0,
      productsByCategory,
    },
    detailExtraction: {
      productsExtracted: totalExtracted,
      images: totalImages,
      downloads: totalDownloads,
      specifications: totalSpecs,
      seoCoverage,
      schemaCoverage: schemaCoveragePct,
      brokenAssets: failedExtractions.count,
      extractionSuccessRate,
    },
    cmsGenerator: {
      pagesGenerated: 0,
      brandsGenerated: 0,
      collectionsGenerated: 0,
      blogPostsGenerated: 0,
      seoCoverage: 0,
      searchCoverage: 0,
      brokenLinks: 0,
      missingMetadata: 0,
      generationSuccessRate: 0,
    },
    extractionRecovery: (() => {
      const summary = getExtractionMetricsSummary();
      const totalExtractionProducts = totalProducts || 1;
      return {
        chromeMcpSuccessRate: summary.totalUrls > 0 ? Math.round((summary.primarySuccessCount / summary.totalUrls) * 100) : 0,
        jcodesmoreRecoveryCount: summary.recoveryL1Count,
        firecrawlRecoveryCount: summary.recoveryL2Count,
        recoverySuccessRate: summary.totalUrls > 0 ? Math.round(((summary.recoveryL1Count + summary.recoveryL2Count) / summary.totalUrls) * 100) : 0,
        averageRetryCount: summary.averageAttempts,
        averageExtractionTimeMs: summary.averageDurationMs,
        totalFailedUrls: summary.failedCount,
        overallExtractionSuccessRate: Math.round((totalExtracted / totalExtractionProducts) * 100),
      };
    })(),
    verification: (() => {
      const vr = db.prepare("SELECT * FROM verification_reports ORDER BY id DESC LIMIT 1").get() as VerificationReport | undefined;
      const ar = db.prepare("SELECT * FROM audit_reports ORDER BY id DESC LIMIT 1").get() as AuditReport | undefined;
      const rr = db.prepare("SELECT * FROM repair_reports ORDER BY id DESC LIMIT 1").get() as RepairReport | undefined;
      return {
        overallStatus: (vr?.overall_status || "SKIPPED") as string,
        totalChecks: vr?.total_checks || 0,
        passedChecks: vr?.passed_checks || 0,
        failedChecks: vr?.failed_checks || 0,
        auditIssues: ar?.total_issues || 0,
        repairsFixed: rr?.fixed_count || 0,
        buildStatus: "SKIPPED" as string,
        deploymentStatus: "SKIPPED" as string,
      };
    })(),
    status: allChecksPass && totalUrls > 0 ? "PASS" : "FAIL",
    checks,
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "delivery-report.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  // Also write to reports/ directory for easy access
  const reportsDir = path.join(process.cwd(), "reports");
  ensureDir(reportsDir);
  fs.writeFileSync(
    path.join(reportsDir, "delivery-report.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}
