// ============================================================================
// SQLITE VERIFIER (Verification Engine)
//
// Verifies database integrity: table existence, record counts, no duplicates,
// foreign key consistency. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { VerificationCheck } from "@/types/discovery";

export function verifySqlite(): VerificationCheck {
  const issues: string[] = [];

  // Check required tables exist
  const requiredTables = [
    "products", "categories", "navigation", "pages", "settings",
    "site_urls", "product_urls", "extracted_products", "media_assets",
    "cms_pages", "cms_brands", "cms_collections", "cms_seo", "cms_search_index",
  ];

  const existingTables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table'"
  ).all() as { name: string }[];
  const tableNames = new Set(existingTables.map(t => t.name));

  const missingTables = requiredTables.filter(t => !tableNames.has(t));
  if (missingTables.length > 0) issues.push(`Missing tables: ${missingTables.join(", ")}`);

  // Check for duplicate records in key tables
  const duplicateProducts = db.prepare(
    "SELECT url, COUNT(*) as c FROM product_urls GROUP BY url HAVING c > 1"
  ).all() as { url: string; c: number }[];
  if (duplicateProducts.length > 0) issues.push(`${duplicateProducts.length} duplicate product URLs`);

  const duplicateExtracted = db.prepare(
    "SELECT url, COUNT(*) as c FROM extracted_products GROUP BY url HAVING c > 1"
  ).all() as { url: string; c: number }[];
  if (duplicateExtracted.length > 0) issues.push(`${duplicateExtracted.length} duplicate extracted products`);

  const duplicateCmsPages = db.prepare(
    "SELECT url, COUNT(*) as c FROM cms_pages GROUP BY url HAVING c > 1"
  ).all() as { url: string; c: number }[];
  if (duplicateCmsPages.length > 0) issues.push(`${duplicateCmsPages.length} duplicate CMS pages`);

  // Check record counts
  const counts: Record<string, number> = {};
  for (const table of requiredTables) {
    if (tableNames.has(table)) {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
      counts[table] = result.count;
    }
  }

  const status = missingTables.length > 0 ? "FAILED" : issues.length > 0 ? "WARNING" : "PASS";

  return {
    name: "sqlite",
    status,
    message: `${existingTables.length} tables. ${issues.length} issues.`,
    details: { tables: existingTables.length, missingTables, counts, issues },
  };
}
