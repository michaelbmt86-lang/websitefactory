// ============================================================================
// CMS GENERATOR ENGINE (Phase 4)
//
// Orchestrates CMS generation: pages, brands, collections, blog posts,
// SEO metadata, search index. Reads from existing discovery tables.
// No site-specific logic.
// ============================================================================

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
import type { CmsGeneratorResult } from "@/types/discovery";

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

  return result;
}
