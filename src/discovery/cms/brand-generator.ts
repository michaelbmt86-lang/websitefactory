// ============================================================================
// BRAND GENERATOR (CMS Generator Engine)
//
// Extracts unique brands from extracted_products and generates CMS brand records.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { ExtractedProduct, CmsBrand } from "@/types/discovery";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateBrands(_siteUrl: string): {
  brands: CmsBrand[];
  brandsGenerated: number;
} {
  // Clear existing CMS brands
  db.prepare("DELETE FROM cms_brands").run();

  // Get all completed extracted products
  const products = db.prepare(
    "SELECT * FROM extracted_products WHERE status = 'completed'"
  ).all() as ExtractedProduct[];

  // Group by brand
  const brandMap = new Map<string, { count: number; firstProduct: ExtractedProduct }>();

  for (const p of products) {
    const brand = p.brand?.trim();
    if (!brand || brand.toLowerCase() === "unknown" || brand.toLowerCase() === "n/a") continue;

    const existing = brandMap.get(brand);
    if (existing) {
      existing.count++;
    } else {
      brandMap.set(brand, { count: 1, firstProduct: p });
    }
  }

  // Insert brands
  const insertStmt = db.prepare(
    "INSERT INTO cms_brands (name, slug, logo_url, description, product_count) VALUES (?, ?, ?, ?, ?)"
  );

  for (const [name, data] of brandMap) {
    const slug = slugify(name);
    const logo = "";
    const description = `Products from ${name}`;

    insertStmt.run(name, slug, logo, description, data.count);
  }

  const allBrands = db.prepare("SELECT * FROM cms_brands ORDER BY product_count DESC").all() as CmsBrand[];

  return {
    brands: allBrands,
    brandsGenerated: allBrands.length,
  };
}
