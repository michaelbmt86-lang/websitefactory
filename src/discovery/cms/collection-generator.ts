// ============================================================================
// COLLECTION GENERATOR (CMS Generator Engine)
//
// Generates CMS collections from product categories. Maps each unique category
// to a collection with product counts. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { ExtractedProduct, CmsCollection } from "@/types/discovery";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateCollections(_siteUrl: string): {
  collections: CmsCollection[];
  collectionsGenerated: number;
} {
  // Clear existing CMS collections
  db.prepare("DELETE FROM cms_collections").run();

  // Get all completed extracted products
  const products = db.prepare(
    "SELECT * FROM extracted_products WHERE status = 'completed'"
  ).all() as ExtractedProduct[];

  // Group by category
  const categoryMap = new Map<string, ExtractedProduct[]>();

  for (const p of products) {
    const category = p.category?.trim() || "Uncategorized";
    const existing = categoryMap.get(category);
    if (existing) {
      existing.push(p);
    } else {
      categoryMap.set(category, [p]);
    }
  }

  // Insert collections
  const insertStmt = db.prepare(
    "INSERT INTO cms_collections (name, slug, description, image_url, product_count, products_json) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const [name, prods] of categoryMap) {
    const slug = slugify(name);
    const description = `${prods.length} products in ${name}`;
    const productsJson = JSON.stringify(prods.map(p => ({ slug: p.slug, name: p.title })));

    insertStmt.run(name, slug, description, "", prods.length, productsJson);
  }

  // Also add "All Products" collection if there are products
  if (products.length > 0) {
    const allProductsJson = JSON.stringify(products.map(p => ({ slug: p.slug, name: p.title })));
    insertStmt.run("All Products", "all-products", "All available products", "", products.length, allProductsJson);
  }

  const allCollections = db.prepare("SELECT * FROM cms_collections ORDER BY product_count DESC").all() as CmsCollection[];

  return {
    collections: allCollections,
    collectionsGenerated: allCollections.length,
  };
}
