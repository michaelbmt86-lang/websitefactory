// ============================================================================
// SEO GENERATOR (CMS Generator Engine)
//
// Auto-generates SEO metadata for all CMS pages. Falls back to page title
// and description when original SEO data is missing. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import { toProductUrl } from "@/lib/public-url";
import type { CmsPage, CmsSeoPage } from "@/types/discovery";
import type { ProjectIdentity } from "../../../deployment/types/identity";

export function generateSeoMetadata(identity: ProjectIdentity): {
  seoPages: CmsSeoPage[];
  seoPagesGenerated: number;
  seoCoverage: number;
} {
  // Clear existing SEO pages
  db.prepare("DELETE FROM cms_seo").run();

  // Get all CMS pages
  const pages = db.prepare("SELECT * FROM cms_pages ORDER BY page_type, title").all() as CmsPage[];

  const insertStmt = db.prepare(`
    INSERT INTO cms_seo (url, slug, page_type, entity_type, entity_id,
      meta_title, meta_description, og_title, og_description, og_image, canonical, schema_json)
    VALUES (?, ?, ?, 'page', ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let withSeo = 0;

  for (const page of pages) {
    const metaTitle = page.meta_title || page.title;
    const metaDescription = page.meta_description || page.description?.slice(0, 160) || "";
    const ogTitle = page.og_title || page.title;
    const ogDescription = page.og_description || metaDescription;
    const ogImage = page.og_image || "";
    const canonical = toProductUrl(page.canonical || page.url, identity.productDomain);
    const schemaJson = page.schema_json || "[]";

    insertStmt.run(
      toProductUrl(page.url, identity.productDomain), page.slug, page.page_type, page.id,
      metaTitle, metaDescription, ogTitle, ogDescription, ogImage, canonical, schemaJson
    );

    if (metaTitle && metaDescription) withSeo++;
  }

  const seoCoverage = pages.length > 0 ? Math.round((withSeo / pages.length) * 100) : 0;

  const seoPages = db.prepare("SELECT * FROM cms_seo ORDER BY page_type, meta_title").all() as CmsSeoPage[];

  return {
    seoPages,
    seoPagesGenerated: seoPages.length,
    seoCoverage,
  };
}
