// ============================================================================
// CMS GENERATOR ENGINE (Phase 4)
//
// Orchestrates CMS generation: pages, brands, collections, blog posts,
// SEO metadata, search index. Reads from existing discovery tables.
// No site-specific logic.
//
// Pipeline Contract:
//   INPUT:  SQLite tables (site_urls, product_urls, extracted_products)
//           written by upstream stages (Discovery, Product Discovery,
//           Detail Extraction).
//   OUTPUT: SQLite tables (cms_pages, cms_brands, cms_collections,
//           cms_search_index) + filesystem artifacts in docs/discovery/:
//     - website-manifest.json
//     - search-index.json
//     - navigation.json
//     - sitemap.json + sitemap.xml
//     - deployment-manifest.json (bridge to Delivery)
//
// The deployment-manifest.json is the handoff contract to the Website Builder
// and Delivery stages. It contains all paths and summary statistics needed
// for deployment.
// ============================================================================

import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { generatePages } from "./page-generator";
import { generateBrands } from "./brand-generator";
import { generateCollections } from "./collection-generator";
import { generateBlogPosts } from "./blog-generator";
import { generateSeoMetadata } from "./seo-generator";
import { generateSearchIndex } from "./search-index-generator";
import { validateCmsQuality } from "./cms-quality-validator";
import {
  generateCmsManifest,
  generateCmsSearchOutput,
  generateCmsNavigation,
  generateCmsSitemap,
} from "./cms-output-generator";
import type { CmsGeneratorResult, DeploymentManifest } from "@/types/discovery";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getOutputDir(): string {
  return path.join(process.cwd(), "docs", "discovery");
}

export async function generateCms(siteUrl: string): Promise<CmsGeneratorResult> {
  const startTimeMs = Date.now();

  console.log("[cms-generator] Starting CMS generation for", siteUrl);

  // 1. Generate pages from site_urls + extracted_products
  console.log("[cms-generator] Generating pages...");
  const pagesResult = generatePages(siteUrl);
  console.log(`[cms-generator] Generated ${pagesResult.pagesGenerated} pages`);

  // 2. Generate brands from extracted_products
  console.log("[cms-generator] Generating brands...");
  const brandsResult = generateBrands(siteUrl);
  console.log(`[cms-generator] Generated ${brandsResult.brandsGenerated} brands`);

  // 3. Generate collections from categories
  console.log("[cms-generator] Generating collections...");
  const collectionsResult = generateCollections(siteUrl);
  console.log(`[cms-generator] Generated ${collectionsResult.collectionsGenerated} collections`);

  // 4. Generate blog posts from posts table
  console.log("[cms-generator] Generating blog posts...");
  const blogResult = generateBlogPosts(siteUrl);
  console.log(`[cms-generator] Generated ${blogResult.blogPostsGenerated} blog posts`);

  // 5. Generate SEO metadata for all pages
  console.log("[cms-generator] Generating SEO metadata...");
  const seoResult = generateSeoMetadata(siteUrl);
  console.log(`[cms-generator] Generated ${seoResult.seoPagesGenerated} SEO entries`);

  // 6. Build search index
  console.log("[cms-generator] Building search index...");
  const searchResult = generateSearchIndex(siteUrl);
  console.log(`[cms-generator] Built search index with ${searchResult.searchIndexEntries} entries`);

  // 7. Generate output files
  console.log("[cms-generator] Generating output files...");
  generateCmsManifest(siteUrl);
  generateCmsSearchOutput(siteUrl);
  generateCmsNavigation(siteUrl);
  generateCmsSitemap(siteUrl);

  // 8. Validate quality
  console.log("[cms-generator] Validating quality...");
  const quality = validateCmsQuality();
  console.log(`[cms-generator] Found ${quality.issues.length} quality issues`);

  const endTimeMs = Date.now();
  const generationTimeMs = endTimeMs - startTimeMs;

  const totalEntities = pagesResult.pagesGenerated + brandsResult.brandsGenerated + collectionsResult.collectionsGenerated + blogResult.blogPostsGenerated;
  const generationSuccessRate = totalEntities > 0 ? Math.round(((totalEntities - quality.issues.filter(i => i.severity === "error").length) / totalEntities) * 100) : 0;

  const result: CmsGeneratorResult = {
    siteUrl,
    startTimeMs,
    endTimeMs,
    generationTimeMs,
    pagesGenerated: pagesResult.pagesGenerated,
    brandsGenerated: brandsResult.brandsGenerated,
    collectionsGenerated: collectionsResult.collectionsGenerated,
    blogPostsGenerated: blogResult.blogPostsGenerated,
    seoPagesGenerated: seoResult.seoPagesGenerated,
    searchIndexEntries: searchResult.searchIndexEntries,
    totalMediaAssets: 0,
    seoCoverage: seoResult.seoCoverage,
    searchCoverage: searchResult.searchCoverage,
    brokenLinks: quality.brokenLinks,
    missingMetadata: quality.missingMetadata + quality.missingSeo,
    generationSuccessRate,
  };

  console.log("[cms-generator] CMS generation complete:", {
    pages: result.pagesGenerated,
    brands: result.brandsGenerated,
    collections: result.collectionsGenerated,
    blog: result.blogPostsGenerated,
    seo: result.seoCoverage + "%",
    search: result.searchCoverage + "%",
    time: result.generationTimeMs + "ms",
  });

  // 9. Generate deployment manifest (bridge to Website Builder → Delivery)
  console.log("[cms-generator] Generating deployment manifest...");
  generateDeploymentManifest(siteUrl, result);
  console.log("[cms-generator] Deployment manifest written to docs/discovery/deployment-manifest.json");

  return result;
}

// ---------------------------------------------------------------------------
// Deployment Manifest — bridges CMS output to Delivery stage
// ---------------------------------------------------------------------------
export function generateDeploymentManifest(
  siteUrl: string,
  cmsResult?: CmsGeneratorResult,
): DeploymentManifest {
  const outDir = getOutputDir();
  ensureDir(outDir);

  // Read summary statistics from SQLite
  const siteUrlCount = (db.prepare("SELECT COUNT(*) as count FROM site_urls").get() as { count: number }).count;
  const productUrlCount = (db.prepare("SELECT COUNT(*) as count FROM product_urls WHERE is_duplicate = 0").get() as { count: number }).count;
  const extractedCount = (db.prepare("SELECT COUNT(*) as count FROM extracted_products WHERE status = 'completed'").get() as { count: number }).count;
  const cmsPageCount = (db.prepare("SELECT COUNT(*) as count FROM cms_pages WHERE status = 'published'").get() as { count: number }).count;
  const brandCount = (db.prepare("SELECT COUNT(*) as count FROM cms_brands").get() as { count: number }).count;
  const collectionCount = (db.prepare("SELECT COUNT(*) as count FROM cms_collections").get() as { count: number }).count;
  const blogCount = (db.prepare("SELECT COUNT(*) as count FROM cms_pages WHERE status = 'published' AND page_type = 'blog-post'").get() as { count: number }).count;
  const seoCount = (db.prepare("SELECT COUNT(*) as count FROM cms_seo").get() as { count: number }).count;
  const searchCount = (db.prepare("SELECT COUNT(*) as count FROM cms_search_index").get() as { count: number }).count;

  const manifest: DeploymentManifest = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    projectName: "websitefactory",
    projectSlug: siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/\./g, "-"),
    targetDomain: siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    environment: process.env.NODE_ENV || "development",
    artifacts: {
      siteMap: path.join(outDir, "site-map.json"),
      urlGraph: path.join(outDir, "url-graph.json"),
      crawlSummary: path.join(outDir, "crawl-summary.json"),
      deliveryReport: path.join(outDir, "delivery-report.json"),
      websiteManifest: path.join(outDir, "website-manifest.json"),
      searchIndex: path.join(outDir, "search-index.json"),
      navigation: path.join(outDir, "navigation.json"),
      sitemap: path.join(outDir, "sitemap.json"),
      sitemapXml: path.join(outDir, "sitemap.xml"),
      verificationReport: path.join(outDir, "verification-report.json"),
      auditReport: path.join(outDir, "audit-report.json"),
      repairReport: path.join(outDir, "repair-report.json"),
    },
    summary: {
      totalSiteUrls: siteUrlCount,
      totalProductUrls: productUrlCount,
      totalExtractedProducts: extractedCount,
      totalCmsPages: cmsPageCount,
      totalBrands: brandCount,
      totalCollections: collectionCount,
      totalBlogPosts: blogCount,
      seoCoverage: cmsResult?.seoCoverage || (cmsPageCount > 0 ? Math.round((seoCount / cmsPageCount) * 100) : 0),
      searchCoverage: cmsResult?.searchCoverage || (cmsPageCount > 0 ? Math.round((searchCount / cmsPageCount) * 100) : 0),
    },
  };

  fs.writeFileSync(
    path.join(outDir, "deployment-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  return manifest;
}
