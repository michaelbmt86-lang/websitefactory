// ============================================================================
// CMS GENERATOR API ROUTE
//
// POST /api/cms-generator — Run CMS generation from extracted data
// GET  /api/cms-generator — Get current CMS state
// ============================================================================

import { NextResponse } from "next/server";
import db from "@/lib/db";
import type { CmsPage, CmsBrand, CmsCollection, CmsSeoPage, CmsSearchIndex } from "@/types/discovery";
import { generateCms } from "@/discovery/cms/cms-generator-engine";
import { validateCmsQuality } from "@/discovery/cms/cms-quality-validator";
import { getProductDomain } from "@/lib/public-url";
import { createProjectIdentity } from "../../../../deployment/types/identity";

export async function GET() {
  try {
    const pages = db.prepare("SELECT * FROM cms_pages ORDER BY page_type, title").all() as CmsPage[];
    const brands = db.prepare("SELECT * FROM cms_brands ORDER BY product_count DESC").all() as CmsBrand[];
    const collections = db.prepare("SELECT * FROM cms_collections ORDER BY product_count DESC").all() as CmsCollection[];
    const seoPages = db.prepare("SELECT * FROM cms_seo ORDER BY page_type").all() as CmsSeoPage[];
    const searchIndex = db.prepare("SELECT * FROM cms_search_index ORDER BY entity_type").all() as CmsSearchIndex[];

    const totalPages = pages.length;
    const publishedPages = pages.filter(p => p.status === "published").length;
    const totalBrands = brands.length;
    const totalCollections = collections.length;
    const totalSeo = seoPages.length;
    const totalSearch = searchIndex.length;

    const blogPages = pages.filter(p => p.page_type === "blog-post");
    const productPages = pages.filter(p => p.page_type === "product-detail");

    const quality = validateCmsQuality();

    return NextResponse.json({
      totalPages,
      publishedPages,
      totalBrands,
      totalCollections,
      totalBlogPosts: blogPages.length,
      totalProductPages: productPages.length,
      totalSeo,
      totalSearch,
      quality: {
        issues: quality.issues.length,
        missingMetadata: quality.missingMetadata,
        missingSeo: quality.missingSeo,
        brokenLinks: quality.brokenLinks,
        duplicateSlugs: quality.duplicateSlugs,
        emptyDescriptions: quality.emptyDescriptions,
      },
      pages: pages.slice(0, 500),
      brands,
      collections,
      seoPages: seoPages.slice(0, 500),
      searchIndex: searchIndex.slice(0, 500),
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

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const result = await generateCms(url, createProjectIdentity(url, getProductDomain()));

    return NextResponse.json({
      success: true,
      result: {
        pagesGenerated: result.pagesGenerated,
        brandsGenerated: result.brandsGenerated,
        collectionsGenerated: result.collectionsGenerated,
        blogPostsGenerated: result.blogPostsGenerated,
        seoPagesGenerated: result.seoPagesGenerated,
        searchIndexEntries: result.searchIndexEntries,
        seoCoverage: result.seoCoverage,
        searchCoverage: result.searchCoverage,
        brokenLinks: result.brokenLinks,
        missingMetadata: result.missingMetadata,
        generationSuccessRate: result.generationSuccessRate,
        generationTimeMs: result.generationTimeMs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
