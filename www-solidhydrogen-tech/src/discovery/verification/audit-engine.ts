// ============================================================================
// AUDIT ENGINE (Verification Engine)
//
// Audits CMS data for issues: missing pages, broken links, missing images,
// missing downloads, duplicate slugs/URLs/products, missing SEO/schema/FAQ.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage, ExtractedProduct, AuditIssue } from "@/types/discovery";

export function runAudit(): {
  issues: AuditIssue[];
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
} {
  const issues: AuditIssue[] = [];

  const pages = db.prepare("SELECT * FROM cms_pages").all() as CmsPage[];
  const products = db.prepare("SELECT * FROM extracted_products WHERE status = 'completed'").all() as ExtractedProduct[];
  const pageUrls = new Set(pages.map(p => p.url));

  // 1. Missing Pages — pages referenced in navigation but not in CMS
  const navLinks = db.prepare("SELECT * FROM navigation").all() as { href: string; label: string }[];
  for (const nav of navLinks) {
    if (nav.href && !nav.href.startsWith("http")) {
      const exists = pages.some(p => p.url.endsWith(nav.href));
      if (!exists) {
        issues.push({
          category: "missing-pages",
          severity: "error",
          message: `Navigation link "${nav.label}" points to non-existent page: ${nav.href}`,
          entity_type: "page",
          entity_id: null,
          entity_slug: nav.href.replace(/^\//, ""),
          fixable: true,
        });
      }
    }
  }

  // 2. Broken Links — canonical URLs pointing to non-existent pages
  for (const page of pages) {
    if (page.canonical && page.canonical !== page.url && !page.canonical.startsWith("http")) {
      if (!pageUrls.has(page.canonical)) {
        issues.push({
          category: "broken-links",
          severity: "warning",
          message: `Page "${page.title}" has broken canonical: ${page.canonical}`,
          entity_type: "page",
          entity_id: page.id,
          entity_slug: page.slug,
          fixable: true,
        });
      }
    }
  }

  // 3. Missing Images — products without images
  for (const product of products) {
    try {
      const images = JSON.parse(product.images_json || "[]");
      if (images.length === 0) {
        issues.push({
          category: "missing-images",
          severity: "warning",
          message: `Product "${product.title}" has no images`,
          entity_type: "product",
          entity_id: product.id,
          entity_slug: product.slug,
          fixable: false,
        });
      }
    } catch {
      issues.push({
        category: "missing-images",
        severity: "warning",
        message: `Product "${product.title}" has invalid images data`,
        entity_type: "product",
        entity_id: product.id,
        entity_slug: product.slug,
        fixable: false,
      });
    }
  }

  // 4. Missing Downloads — products without downloads
  for (const product of products) {
    try {
      const downloads = JSON.parse(product.downloads_json || "[]");
      if (downloads.length === 0) {
        issues.push({
          category: "missing-downloads",
          severity: "info",
          message: `Product "${product.title}" has no downloads`,
          entity_type: "product",
          entity_id: product.id,
          entity_slug: product.slug,
          fixable: false,
        });
      }
    } catch { /* skip */ }
  }

  // 5. Duplicate Slugs
  const slugCounts = new Map<string, number>();
  for (const page of pages) {
    slugCounts.set(page.slug, (slugCounts.get(page.slug) || 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      issues.push({
        category: "duplicate-slugs",
        severity: "error",
        message: `Slug "${slug}" is used by ${count} pages`,
        entity_type: "page",
        entity_id: null,
        entity_slug: slug,
        fixable: true,
      });
    }
  }

  // 6. Duplicate URLs
  const urlCounts = new Map<string, number>();
  for (const page of pages) {
    urlCounts.set(page.url, (urlCounts.get(page.url) || 0) + 1);
  }
  for (const [url, count] of urlCounts) {
    if (count > 1) {
      issues.push({
        category: "duplicate-urls",
        severity: "error",
        message: `URL "${url}" is used by ${count} pages`,
        entity_type: "page",
        entity_id: null,
        entity_slug: url,
        fixable: true,
      });
    }
  }

  // 7. Duplicate Products
  const productUrlCounts = new Map<string, number>();
  for (const p of products) {
    productUrlCounts.set(p.url, (productUrlCounts.get(p.url) || 0) + 1);
  }
  for (const [url, count] of productUrlCounts) {
    if (count > 1) {
      issues.push({
        category: "duplicate-products",
        severity: "error",
        message: `Product URL "${url}" appears ${count} times`,
        entity_type: "product",
        entity_id: null,
        entity_slug: url,
        fixable: false,
      });
    }
  }

  // 8. Missing SEO
  for (const page of pages) {
    if (!page.meta_title || !page.meta_description) {
      issues.push({
        category: "missing-seo",
        severity: "warning",
        message: `Page "${page.title}" missing SEO metadata`,
        entity_type: "page",
        entity_id: page.id,
        entity_slug: page.slug,
        fixable: true,
      });
    }
  }

  // 9. Missing Schema
  for (const page of pages) {
    try {
      const schema = JSON.parse(page.schema_json || "[]");
      if (schema.length === 0) {
        issues.push({
          category: "missing-schema",
          severity: "info",
          message: `Page "${page.title}" missing structured data`,
          entity_type: "page",
          entity_id: page.id,
          entity_slug: page.slug,
          fixable: false,
        });
      }
    } catch { /* skip */ }
  }

  // 10. Missing FAQ
  for (const product of products) {
    try {
      const faq = JSON.parse(product.faq_json || "[]");
      if (faq.length === 0) {
        issues.push({
          category: "missing-faq",
          severity: "info",
          message: `Product "${product.title}" missing FAQ`,
          entity_type: "product",
          entity_id: product.id,
          entity_slug: product.slug,
          fixable: false,
        });
      }
    } catch { /* skip */ }
  }

  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;
  const fixableCount = issues.filter(i => i.fixable).length;

  return {
    issues,
    totalIssues: issues.length,
    errorCount,
    warningCount,
    infoCount,
    fixableCount,
  };
}
