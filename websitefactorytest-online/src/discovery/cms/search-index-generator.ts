// ============================================================================
// SEARCH INDEX GENERATOR (CMS Generator Engine)
//
// Builds a full-text search index across all CMS entities (pages, products,
// brands, collections, blog posts). No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import { toProductUrl } from "@/lib/public-url";
import type { CmsPage, ExtractedProduct, CmsBrand, CmsCollection, CmsSearchIndex } from "@/types/discovery";
import type { ProjectIdentity } from "../../../deployment/types/identity";

export function generateSearchIndex(identity: ProjectIdentity): {
  entries: CmsSearchIndex[];
  searchIndexEntries: number;
  searchCoverage: number;
} {
  // Clear existing search index
  db.prepare("DELETE FROM cms_search_index").run();

  let totalEntities = 0;
  let indexedEntities = 0;

  const insertStmt = db.prepare(`
    INSERT INTO cms_search_index (entity_type, entity_id, title, description, keywords, url, image_url, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Index CMS pages
  const pages = db.prepare("SELECT * FROM cms_pages WHERE status = 'published'").all() as CmsPage[];
  for (const page of pages) {
    totalEntities++;
    const keywords = [page.page_type, page.title, page.description].filter(Boolean).join(" ");
    insertStmt.run(
      "page",
      page.id,
      page.title,
      page.description,
      keywords,
      toProductUrl(page.url, identity.productDomain),
      page.og_image || "",
      page.page_type,
    );
    indexedEntities++;
  }

  // 2. Index extracted products
  const products = db.prepare(
    "SELECT * FROM extracted_products WHERE status = 'completed'"
  ).all() as ExtractedProduct[];
  for (const product of products) {
    totalEntities++;
    const keywords = [product.title, product.brand, product.category, product.subcategory, product.model].filter(Boolean).join(" ");
    let primaryImage = "";
    try {
      const images = JSON.parse(product.images_json || "[]");
      if (images.length > 0) primaryImage = images[0].url || "";
    } catch { /* skip */ }
    insertStmt.run(
      "product", product.id, product.title,
      product.short_description || product.description?.slice(0, 200) || "",
      keywords, toProductUrl(product.url, identity.productDomain), primaryImage, product.category
    );
    indexedEntities++;
  }

  // 3. Index brands
  const brands = db.prepare("SELECT * FROM cms_brands").all() as CmsBrand[];
  for (const brand of brands) {
    totalEntities++;
    const keywords = [brand.name, brand.description].filter(Boolean).join(" ");
    insertStmt.run("brand", brand.id, brand.name, brand.description, keywords, `https://${identity.productDomain}/brands/${brand.slug}`, brand.logo_url || "", "brand");
    indexedEntities++;
  }

  // 4. Index collections
  const collections = db.prepare("SELECT * FROM cms_collections").all() as CmsCollection[];
  for (const collection of collections) {
    totalEntities++;
    const keywords = [collection.name, collection.description].filter(Boolean).join(" ");
    insertStmt.run("collection", collection.id, collection.name, collection.description, keywords, `https://${identity.productDomain}/collections/${collection.slug}`, collection.image_url || "", "collection");
    indexedEntities++;
  }

  const searchCoverage = totalEntities > 0 ? Math.round((indexedEntities / totalEntities) * 100) : 0;

  const entries = db.prepare("SELECT * FROM cms_search_index ORDER BY entity_type, title").all() as CmsSearchIndex[];

  return {
    entries,
    searchIndexEntries: entries.length,
    searchCoverage,
  };
}
