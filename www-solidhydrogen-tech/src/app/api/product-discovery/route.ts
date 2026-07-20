// ============================================================================
// PRODUCT DISCOVERY API ROUTE
//
// POST /api/product-discovery — Run product discovery
// GET  /api/product-discovery — Get current product discovery results
// ============================================================================

import { NextResponse } from "next/server";
import db from "@/lib/db";
import type { ProductUrl } from "@/types/discovery";
import { discoverProducts } from "@/discovery/product-discovery-engine";
import {
  generateProductIndexJson,
  generateCategoryIndexJson,
  generateProductDiscoverySummary,
} from "@/discovery/product-output-generator";

export async function GET() {
  try {
    const products = db.prepare("SELECT * FROM product_urls ORDER BY category, product_name").all() as ProductUrl[];

    const totalProducts = products.filter(p => !p.is_duplicate).length;
    const totalCategories = new Set(products.map(p => p.category)).size;
    const duplicatesFound = products.filter(p => p.is_duplicate).length;
    const brokenProducts = products.filter(p => p.status === "broken").length;
    const crawledProducts = products.filter(p => p.status === "crawled").length;
    const coverage = products.length > 0 ? Math.round((crawledProducts / products.length) * 100) : 0;

    const productsByCategory: Record<string, number> = {};
    const productsByStatus: Record<string, number> = {};

    for (const p of products) {
      productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
      productsByStatus[p.status] = (productsByStatus[p.status] || 0) + 1;
    }

    return NextResponse.json({
      totalProducts,
      totalCategories,
      duplicatesFound,
      brokenProducts,
      coverage,
      productsByCategory,
      productsByStatus,
      products: products.slice(0, 200),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, maxPaginationPages = 50, maxProducts = 5000 } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Run product discovery
    const result = await discoverProducts(url, { maxPaginationPages, maxProducts });

    // Generate output files
    const productIndex = generateProductIndexJson(url);
    const categoryIndex = generateCategoryIndexJson(url);
    const summary = generateProductDiscoverySummary(url);

    return NextResponse.json({
      success: true,
      result: {
        totalProducts: result.totalProducts,
        totalCategories: result.totalCategories,
        productsByCategory: result.productsByCategory,
        duplicatesFound: result.duplicatesFound,
        brokenProducts: result.brokenProducts,
        pagesCrawled: result.pagesCrawled,
        discoveryTimeMs: result.discoveryTimeMs,
      },
      files: {
        productIndex: productIndex.totalProducts,
        categoryIndex: categoryIndex.totalCategories,
        summary: summary.totalProducts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
