// ============================================================================
// DETAIL EXTRACTION API ROUTE
//
// POST /api/detail-extraction — Run detail extraction on all products
// GET  /api/detail-extraction — Get current extraction results
// ============================================================================

import { NextResponse } from "next/server";
import db from "@/lib/db";
import type { ExtractedProduct } from "@/types/discovery";
import { extractProductDetails } from "@/discovery/detail-extraction-engine";
import {
  generateProductsJson,
  generateMediaLibraryJson,
  generateSEOLibraryJson,
  generateSchemaLibraryJson,
} from "@/discovery/detail-output-generator";
import { validateExtractionQuality } from "@/discovery/quality-validator";

export async function GET() {
  try {
    const products = db.prepare("SELECT * FROM extracted_products ORDER BY category, title").all() as ExtractedProduct[];

    const totalProducts = products.length;
    const completed = products.filter(p => p.status === "completed").length;
    const failed = products.filter(p => p.status === "failed").length;
    const pending = products.filter(p => p.status === "pending").length;
    const extracting = products.filter(p => p.status === "extracting").length;
    const coverage = totalProducts > 0 ? Math.round((completed / totalProducts) * 100) : 0;

    // Stats
    let totalImages = 0;
    let totalDownloads = 0;
    let productsWithSEO = 0;
    let productsWithSchema = 0;
    let productsWithSpecs = 0;
    let productsWithFAQ = 0;

    for (const p of products.filter(p => p.status === "completed")) {
      try { totalImages += JSON.parse(p.images_json || "[]").length; } catch { /* skip */ }
      try { totalDownloads += JSON.parse(p.downloads_json || "[]").length; } catch { /* skip */ }
      try {
        const seo = JSON.parse(p.seo_json || "{}");
        if (seo.title || seo.metaDescription) productsWithSEO++;
      } catch { /* skip */ }
      try {
        const schema = JSON.parse(p.schema_json || "[]");
        if (schema.length > 0) productsWithSchema++;
      } catch { /* skip */ }
      try {
        const specs = JSON.parse(p.specifications_json || "[]");
        if (specs.length > 0) productsWithSpecs++;
      } catch { /* skip */ }
      try {
        const faq = JSON.parse(p.faq_json || "[]");
        if (faq.length > 0) productsWithFAQ++;
      } catch { /* skip */ }
    }

    const totalMedia = db.prepare("SELECT COUNT(*) as count FROM media_assets").get() as { count: number };

    const quality = validateExtractionQuality();

    return NextResponse.json({
      totalProducts,
      completed,
      failed,
      pending,
      extracting,
      coverage,
      totalImages,
      totalDownloads,
      totalMediaAssets: totalMedia.count,
      productsWithSEO,
      productsWithSchema,
      productsWithSpecs,
      productsWithFAQ,
      quality: {
        issues: quality.issues.length,
        missingImages: quality.missingImages,
        missingSEO: quality.missingSEO,
        missingSchema: quality.missingSchema,
        brokenDownloads: quality.brokenDownloads,
        duplicateProducts: quality.duplicateProducts,
      },
      products: products.slice(0, 500),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, concurrency = 3, maxRetries = 2, resumeFromFailure = true } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Run detail extraction
    const result = await extractProductDetails(url, { concurrency, maxRetries, resumeFromFailure });

    // Generate output files
    const productsJson = generateProductsJson(url);
    const mediaJson = generateMediaLibraryJson(url);
    const seoJson = generateSEOLibraryJson(url);
    const schemaJson = generateSchemaLibraryJson(url);

    return NextResponse.json({
      success: true,
      result: {
        totalProducts: result.totalProducts,
        extractedProducts: result.extractedProducts,
        failedProducts: result.failedProducts,
        retriedProducts: result.retriedProducts,
        extractionTimeMs: result.extractionTimeMs,
        extractionCoverage: result.extractionCoverage,
        seoCoverage: result.seoCoverage,
        schemaCoverage: result.schemaCoverage,
        imagesCoverage: result.imagesCoverage,
        totalImages: result.totalImages,
        totalDownloads: result.totalDownloads,
        totalMediaAssets: result.totalMediaAssets,
      },
      files: {
        productsJson: productsJson.totalProducts,
        mediaJson: mediaJson.totalAssets,
        seoJson: seoJson.productsWithSEO,
        schemaJson: schemaJson.productsWithSchema,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
