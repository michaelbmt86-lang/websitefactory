// ============================================================================
// PAGE GENERATOR (CMS Generator Engine)
//
// Generates CMS pages from site_urls and extracted_products. Maps page types
// to CMS page types. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import { toProductUrl } from "@/lib/public-url";
import { slugify } from "@/lib/slugify";
import type { SiteUrl, ExtractedProduct, CmsPage, CmsPageInput } from "@/types/discovery";
import type { ProjectIdentity } from "../../../deployment/types/identity";

function mapPageType(pageType: string): string {
  const mapping: Record<string, string> = {
    Home: "homepage",
    Category: "category",
    "Product Listing": "product-listing",
    "Product Detail": "product-detail",
    Blog: "blog-listing",
    Article: "blog-post",
    Landing: "landing",
    Contact: "contact",
    Policy: "policy",
    About: "about",
    Search: "search",
    Tag: "tag",
    Author: "author",
    Archive: "archive",
    Unknown: "page",
  };
  return mapping[pageType] || "page";
}

export function generatePages(identity: ProjectIdentity): {
  pages: CmsPage[];
  pagesGenerated: number;
} {
  // Clear existing CMS pages
  db.prepare("DELETE FROM cms_pages").run();

  const pages: CmsPageInput[] = [];

  // 1. Generate pages from site_urls
  const siteUrls = db.prepare(
    "SELECT * FROM site_urls WHERE status IN ('crawled', 'discovered') ORDER BY depth, priority DESC"
  ).all() as SiteUrl[];

  for (const su of siteUrls) {
    const title = su.title || su.h1 || slugify(su.slug).replace(/-/g, " ");
    const description = su.meta_description || "";
    const pageType = mapPageType(su.page_type);

    pages.push({
      url: toProductUrl(su.url, identity.productDomain),
      slug: su.slug,
      title,
      description,
      page_type: pageType,
      source_table: "site_urls",
      source_id: su.id,
      meta_title: su.title || title,
      meta_description: description,
      og_title: title,
      og_description: description,
      og_image: "",
      canonical: toProductUrl(su.canonical_url || su.url, identity.productDomain),
      schema_json: su.json_ld || "[]",
      status: "published",
    });
  }

  // 2. Generate product detail pages from extracted_products (if not already in site_urls)
  const extractedProducts = db.prepare(
    "SELECT * FROM extracted_products WHERE status = 'completed'"
  ).all() as ExtractedProduct[];

  const existingSlugs = new Set(pages.map(p => p.slug));

  for (const ep of extractedProducts) {
    if (existingSlugs.has(ep.slug)) continue;

    let seo = {};
    try { seo = JSON.parse(ep.seo_json || "{}"); } catch { /* skip */ }
    const seoRecord = seo as Record<string, string>;

    pages.push({
      url: toProductUrl(ep.url, identity.productDomain),
      slug: ep.slug,
      title: ep.title || seoRecord.title || slugify(ep.slug),
      description: ep.short_description || ep.description?.slice(0, 200) || "",
      page_type: "product-detail",
      source_table: "extracted_products",
      source_id: ep.id,
      meta_title: seoRecord.title || ep.title || "",
      meta_description: seoRecord.metaDescription || "",
      og_title: seoRecord.ogTitle || "",
      og_description: seoRecord.ogDescription || "",
      og_image: seoRecord.ogImage || "",
      canonical: toProductUrl(seoRecord.canonical || ep.url, identity.productDomain),
      schema_json: ep.schema_json || "[]",
      status: "published",
    });
    existingSlugs.add(ep.slug);
  }

  // Insert all pages
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO cms_pages (url, slug, title, description, page_type, source_table, source_id,
      meta_title, meta_description, og_title, og_description, og_image, canonical, schema_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of pages) {
    insertStmt.run(
      p.url, p.slug, p.title, p.description || "", p.page_type || "page",
      p.source_table || "", p.source_id ?? null,
      p.meta_title || "", p.meta_description || "",
      p.og_title || "", p.og_description || "", p.og_image || "",
      p.canonical || "", p.schema_json || "[]", p.status || "published"
    );
  }

  // Read back all inserted pages
  const allPages = db.prepare("SELECT * FROM cms_pages ORDER BY page_type, title").all() as CmsPage[];

  return {
    pages: allPages,
    pagesGenerated: allPages.length,
  };
}
