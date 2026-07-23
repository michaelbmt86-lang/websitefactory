// ============================================================================
// COVERAGE VERIFIER (Verification Engine)
//
// Verifies clone content coverage across pipeline stages.
// Read-only SQLite queries. No external calls.
// ============================================================================

import db from "@/lib/db";
import type { VerificationCheck } from "@/types/discovery";

// ---------------------------------------------------------------------------
// URL Coverage: sitemap URLs vs site_urls
// ---------------------------------------------------------------------------

export function verifyUrlCoverage(): VerificationCheck {
  const siteUrls = db.prepare("SELECT COUNT(*) as count FROM site_urls").get() as { count: number };
  const discovered = db.prepare("SELECT COUNT(*) as count FROM site_urls WHERE status = 'crawled' OR status = 'discovered'").get() as { count: number };

  if (siteUrls.count === 0) {
    return { name: "coverage-urls", status: "WARNING", message: "No site_urls found — discovery stage may not have run", details: { total: 0, discovered: 0 } };
  }

  const coverage = siteUrls.count > 0 ? (discovered.count / siteUrls.count) * 100 : 0;
  const status = coverage >= 80 ? "PASS" : coverage >= 50 ? "WARNING" : "FAILED";

  return {
    name: "coverage-urls",
    status,
    message: `${discovered.count}/${siteUrls.count} site_urls processed (${coverage.toFixed(1)}%)`,
    details: { total: siteUrls.count, discovered: discovered.count, coveragePercent: coverage },
  };
}

// ---------------------------------------------------------------------------
// Product Coverage: product_urls vs extracted_products
// ---------------------------------------------------------------------------

export function verifyProductCoverage(): VerificationCheck {
  const productUrls = db.prepare("SELECT COUNT(*) as count FROM product_urls WHERE is_duplicate = 0").get() as { count: number };
  const extracted = db.prepare("SELECT COUNT(*) as count FROM extracted_products WHERE status = 'completed'").get() as { count: number };
  const failed = db.prepare("SELECT COUNT(*) as count FROM extracted_products WHERE status = 'failed'").get() as { count: number };

  if (productUrls.count === 0) {
    return { name: "coverage-products", status: "WARNING", message: "No product_urls found — product discovery stage may not have run", details: { total: 0, extracted: 0, failed: 0 } };
  }

  const coverage = productUrls.count > 0 ? (extracted.count / productUrls.count) * 100 : 0;
  const status = coverage >= 80 ? "PASS" : coverage >= 50 ? "WARNING" : "FAILED";

  return {
    name: "coverage-products",
    status,
    message: `${extracted.count}/${productUrls.count} products extracted (${coverage.toFixed(1)}%), ${failed.count} failed`,
    details: { total: productUrls.count, extracted: extracted.count, failed: failed.count, coveragePercent: coverage },
  };
}

// ---------------------------------------------------------------------------
// CMS Coverage: extracted_products vs CMS product pages
// ---------------------------------------------------------------------------

export function verifyCmsCoverage(): VerificationCheck {
  const extracted = db.prepare("SELECT COUNT(*) as count FROM extracted_products WHERE status = 'completed'").get() as { count: number };
  const cmsPages = db.prepare("SELECT COUNT(*) as count FROM cms_pages WHERE page_type = 'product'").get() as { count: number };
  const cmsBrands = db.prepare("SELECT COUNT(*) as count FROM cms_brands").get() as { count: number };
  const cmsCollections = db.prepare("SELECT COUNT(*) as count FROM cms_collections").get() as { count: number };

  if (extracted.count === 0) {
    return { name: "coverage-cms", status: "WARNING", message: "No extracted products found — extraction stage may not have run", details: { extracted: 0, cmsProducts: 0 } };
  }

  const coverage = extracted.count > 0 ? (cmsPages.count / extracted.count) * 100 : 0;
  const status = coverage >= 80 ? "PASS" : coverage >= 50 ? "WARNING" : "FAILED";

  return {
    name: "coverage-cms",
    status,
    message: `${cmsPages.count}/${extracted.count} CMS product pages generated (${coverage.toFixed(1)}%), ${cmsBrands.count} brands, ${cmsCollections.count} collections`,
    details: { extracted: extracted.count, cmsProducts: cmsPages.count, cmsBrands: cmsBrands.count, cmsCollections: cmsCollections.count, coveragePercent: coverage },
  };
}
