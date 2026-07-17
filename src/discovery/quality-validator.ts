// ============================================================================
// QUALITY VALIDATOR
//
// Validates extracted product data for completeness and quality.
// Checks missing images, SEO, broken downloads, duplicates, etc.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { ExtractedProduct, QualityCheckResult, QualityIssue } from "@/types/discovery";

export function validateExtractionQuality(): QualityCheckResult {
  const issues: QualityIssue[] = [];

  const products = db.prepare(`
    SELECT * FROM extracted_products WHERE status = 'completed'
  `).all() as ExtractedProduct[];

  const totalProducts = products.length;
  let missingImages = 0;
  let missingSEO = 0;
  let missingSchema = 0;
  let missingSpecs = 0;
  let brokenDownloads = 0;
  let brokenMedia = 0;
  let duplicateProducts = 0;
  let duplicateImages = 0;

  const urlSeen = new Set<string>();
  const imageUrls = new Map<string, string[]>(); // url -> slugs

  for (const product of products) {
    // Duplicate products
    if (urlSeen.has(product.url)) {
      duplicateProducts++;
      issues.push({
        productUrl: product.url,
        productSlug: product.slug,
        issueType: "duplicate-product",
        severity: "error",
        message: `Duplicate product URL: ${product.url}`,
      });
    }
    urlSeen.add(product.url);

    // Missing images
    const images = safeJsonParse(product.images_json, [] as unknown[]);
    if (images.length === 0) {
      missingImages++;
      issues.push({
        productUrl: product.url,
        productSlug: product.slug,
        issueType: "missing-image",
        severity: "error",
        message: "No images found for this product",
      });
    }

    // Missing SEO
    const seo = safeJsonParse(product.seo_json, {} as Record<string, unknown>) as Record<string, unknown>;
    if (!seo.title && !seo.metaDescription) {
      missingSEO++;
      issues.push({
        productUrl: product.url,
        productSlug: product.slug,
        issueType: "missing-seo",
        severity: "warning",
        message: "No SEO title or meta description found",
      });
    }

    // Missing Schema
    const schema = safeJsonParse(product.schema_json, [] as unknown[]) as unknown[];
    if (schema.length === 0) {
      missingSchema++;
      issues.push({
        productUrl: product.url,
        productSlug: product.slug,
        issueType: "missing-schema",
        severity: "warning",
        message: "No structured data (JSON-LD) found",
      });
    }

    // Missing Specs
    const specs = safeJsonParse(product.specifications_json, [] as unknown[]) as unknown[];
    if (specs.length === 0) {
      missingSpecs++;
      issues.push({
        productUrl: product.url,
        productSlug: product.slug,
        issueType: "missing-specs",
        severity: "warning",
        message: "No specifications found",
      });
    }

    // Duplicate images across products
    for (const img of images) {
      const imgObj = img as Record<string, unknown>;
      const imgUrl = String(imgObj.url || imgObj);
      if (typeof imgUrl === "string" && imgUrl.startsWith("http")) {
        if (!imageUrls.has(imgUrl)) {
          imageUrls.set(imgUrl, []);
        }
        imageUrls.get(imgUrl)!.push(product.slug);

        if (imageUrls.get(imgUrl)!.length === 2) {
          duplicateImages++;
          issues.push({
            productUrl: product.url,
            productSlug: product.slug,
            issueType: "duplicate-image",
            severity: "warning",
            message: `Image ${imgUrl} is shared by multiple products`,
          });
        }
      }
    }
  }

  // Check for broken downloads (URLs that are just anchors or javascript)
  const mediaAssets = db.prepare(`
    SELECT * FROM media_assets WHERE type IN ('pdf', 'download')
  `).all() as { url: string; product_id: number }[];

  for (const asset of mediaAssets) {
    if (!asset.url || asset.url.startsWith("#") || asset.url.startsWith("javascript:")) {
      brokenDownloads++;
      const product = products.find(p => p.id === asset.product_id);
      if (product) {
        issues.push({
          productUrl: product.url,
          productSlug: product.slug,
          issueType: "broken-download",
          severity: "error",
          message: `Broken download URL: ${asset.url}`,
        });
      }
    }
  }

  // Check for broken media
  const allMedia = db.prepare("SELECT * FROM media_assets").all() as { url: string; product_id: number }[];
  for (const asset of allMedia) {
    if (!asset.url || asset.url.startsWith("data:")) {
      brokenMedia++;
    }
  }

  return {
    totalProducts,
    missingImages,
    missingSEO,
    missingSchema,
    brokenDownloads,
    brokenMedia,
    duplicateProducts,
    duplicateImages,
    missingSpecs,
    issues,
  };
}

function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}
