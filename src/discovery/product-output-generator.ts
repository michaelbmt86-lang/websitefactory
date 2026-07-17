// ============================================================================
// PRODUCT OUTPUT GENERATOR
//
// Generates product-index.json, category-index.json, product-discovery-summary.json.
// Reusable — no site-specific logic.
// ============================================================================

import fs from "fs";
import path from "path";
import db from "@/lib/db";
import type { ProductUrl } from "@/types/discovery";
import type {
  ProductIndexOutput,
  CategoryIndexOutput,
  ProductDiscoverySummaryOutput,
} from "@/types/discovery";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getOutputDir(): string {
  return path.join(process.cwd(), "docs", "discovery");
}

export function generateProductIndexJson(siteUrl: string): ProductIndexOutput {
  const products = db.prepare(`
    SELECT * FROM product_urls WHERE is_duplicate = 0 ORDER BY category, product_name
  `).all() as ProductUrl[];

  const output: ProductIndexOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    products: products.map(p => ({
      url: p.url,
      slug: p.product_slug,
      name: p.product_name,
      category: p.category,
      price: p.price,
      sku: p.sku,
      imageUrl: p.image_url,
      inStock: p.in_stock === 1,
      isDuplicate: p.is_duplicate === 1,
      sourcePage: p.source_page,
    })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "product-index.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateCategoryIndexJson(siteUrl: string): CategoryIndexOutput {
  const products = db.prepare(`
    SELECT * FROM product_urls WHERE is_duplicate = 0 ORDER BY category, product_name
  `).all() as ProductUrl[];

  // Group by category
  const categoryMap = new Map<string, ProductUrl[]>();
  for (const p of products) {
    const cat = p.category || "Unknown";
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(p);
  }

  // Find listing pages per category
  const listingPages = db.prepare(`
    SELECT category, source_page, COUNT(*) as count
    FROM product_urls WHERE is_duplicate = 0 AND source_page != ''
    GROUP BY category, source_page ORDER BY category, count DESC
  `).all() as { category: string; source_page: string; count: number }[];

  const categoryListingMap = new Map<string, string>();
  for (const lp of listingPages) {
    if (!categoryListingMap.has(lp.category)) {
      categoryListingMap.set(lp.category, lp.source_page);
    }
  }

  const output: CategoryIndexOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalCategories: categoryMap.size,
    categories: [...categoryMap.entries()]
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([name, cats]) => ({
        name,
        productCount: cats.length,
        listingPage: categoryListingMap.get(name) || "",
        products: cats.slice(0, 50).map(p => ({
          url: p.url,
          slug: p.product_slug,
          name: p.product_name,
        })),
      })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "category-index.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateProductDiscoverySummary(siteUrl: string): ProductDiscoverySummaryOutput {
  const products = db.prepare("SELECT * FROM product_urls").all() as ProductUrl[];

  const totalProducts = products.filter(p => !p.is_duplicate).length;
  const duplicatesFound = products.filter(p => p.is_duplicate).length;
  const brokenProducts = products.filter(p => p.status === "broken").length;

  const productsByCategory: Record<string, number> = {};
  const productsByStatus: Record<string, number> = {};

  for (const p of products) {
    productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
    productsByStatus[p.status] = (productsByStatus[p.status] || 0) + 1;
  }

  // Top listing pages
  const topListingPages = db.prepare(`
    SELECT source_page, COUNT(*) as productsFound
    FROM product_urls WHERE is_duplicate = 0 AND source_page != ''
    GROUP BY source_page ORDER BY productsFound DESC LIMIT 20
  `).all() as { source_page: string; productsFound: number }[];

  const output: ProductDiscoverySummaryOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    discoveryTimeMs: 0,
    totalProducts,
    totalCategories: Object.keys(productsByCategory).length,
    duplicatesFound,
    brokenProducts,
    pagesCrawled: 0,
    paginationPagesCrawled: 0,
    productsByCategory,
    productsByStatus,
    topListingPages: topListingPages.map(l => ({
      url: l.source_page,
      productsFound: l.productsFound,
    })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "product-discovery-summary.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}
