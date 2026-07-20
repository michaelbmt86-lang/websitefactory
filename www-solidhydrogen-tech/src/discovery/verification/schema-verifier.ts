// ============================================================================
// SCHEMA VERIFIER (Verification Engine)
//
// Verifies structured data (JSON-LD) across all CMS pages and products.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage, ExtractedProduct, VerificationCheck } from "@/types/discovery";

export function verifySchema(): VerificationCheck {
  const pages = db.prepare("SELECT * FROM cms_pages WHERE status = 'published'").all() as CmsPage[];
  const products = db.prepare("SELECT * FROM extracted_products WHERE status = 'completed'").all() as ExtractedProduct[];

  const totalPages = pages.length;
  const totalProducts = products.length;

  if (totalPages === 0 && totalProducts === 0) {
    return { name: "schema", status: "SKIPPED", message: "No pages or products to verify" };
  }

  const issues: string[] = [];
  let pagesWithSchema = 0;
  let productsWithSchema = 0;

  for (const page of pages) {
    try {
      const schema = JSON.parse(page.schema_json || "[]");
      if (schema.length > 0) pagesWithSchema++;
    } catch { /* skip */ }
  }

  for (const product of products) {
    try {
      const schema = JSON.parse(product.schema_json || "[]");
      if (schema.length > 0) productsWithSchema++;
    } catch { /* skip */ }
  }

  if (totalPages > 0 && pagesWithSchema === 0) issues.push("No pages have structured data");
  if (totalProducts > 0 && productsWithSchema === 0) issues.push("No products have structured data");

  const totalEntities = totalPages + totalProducts;
  const totalWithSchema = pagesWithSchema + productsWithSchema;
  const coverage = totalEntities > 0 ? Math.round((totalWithSchema / totalEntities) * 100) : 0;

  const status = coverage >= 70 ? "PASS" : coverage >= 30 ? "WARNING" : "FAILED";

  return {
    name: "schema",
    status,
    message: `Schema coverage: ${coverage}% (${pagesWithSchema} pages, ${productsWithSchema} products).`,
    details: { totalPages, totalProducts, pagesWithSchema, productsWithSchema, coverage, issues },
  };
}
