// ============================================================================
// CMS QUALITY VALIDATOR (CMS Generator Engine)
//
// Validates CMS data completeness: missing metadata, broken links,
// duplicate slugs, empty descriptions. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage, CmsBrand, CmsCollection, CmsQualityResult, CmsQualityIssue } from "@/types/discovery";

export function validateCmsQuality(): CmsQualityResult {
  const issues: CmsQualityIssue[] = [];
  let totalEntities = 0;

  // 1. Check CMS pages
  const pages = db.prepare("SELECT * FROM cms_pages").all() as CmsPage[];
  for (const page of pages) {
    totalEntities++;

    if (!page.meta_title && !page.meta_description) {
      issues.push({
        entityType: "page",
        entityId: page.id,
        entitySlug: page.slug,
        issueType: "missing-metadata",
        severity: "warning",
        message: `Page "${page.title}" missing meta title and description`,
      });
    }

    if (!page.og_title && !page.og_description) {
      issues.push({
        entityType: "page",
        entityId: page.id,
        entitySlug: page.slug,
        issueType: "missing-seo",
        severity: "warning",
        message: `Page "${page.title}" missing Open Graph metadata`,
      });
    }

    if (!page.description) {
      issues.push({
        entityType: "page",
        entityId: page.id,
        entitySlug: page.slug,
        issueType: "empty-description",
        severity: "warning",
        message: `Page "${page.title}" has empty description`,
      });
    }
  }

  // 2. Check brands
  const brands = db.prepare("SELECT * FROM cms_brands").all() as CmsBrand[];
  for (const brand of brands) {
    totalEntities++;

    if (!brand.description || brand.description === `Products from ${brand.name}`) {
      issues.push({
        entityType: "brand",
        entityId: brand.id,
        entitySlug: brand.slug,
        issueType: "empty-description",
        severity: "warning",
        message: `Brand "${brand.name}" has auto-generated description`,
      });
    }

    if (!brand.logo_url) {
      issues.push({
        entityType: "brand",
        entityId: brand.id,
        entitySlug: brand.slug,
        issueType: "missing-image",
        severity: "warning",
        message: `Brand "${brand.name}" missing logo`,
      });
    }
  }

  // 3. Check collections
  const collections = db.prepare("SELECT * FROM cms_collections").all() as CmsCollection[];
  for (const collection of collections) {
    totalEntities++;

    if (!collection.description || collection.description.startsWith("Products in ")) {
      issues.push({
        entityType: "collection",
        entityId: collection.id,
        entitySlug: collection.slug,
        issueType: "empty-description",
        severity: "warning",
        message: `Collection "${collection.name}" has auto-generated description`,
      });
    }
  }

  // 4. Check for duplicate slugs across pages
  const slugCounts = db.prepare(
    "SELECT slug, COUNT(*) as count FROM cms_pages GROUP BY slug HAVING count > 1"
  ).all() as { slug: string; count: number }[];

  for (const sc of slugCounts) {
    issues.push({
      entityType: "page",
      entityId: 0,
      entitySlug: sc.slug,
      issueType: "duplicate-slug",
      severity: "error",
      message: `Slug "${sc.slug}" is used by ${sc.count} pages`,
    });
  }

  // 5. Check for broken internal links (links pointing to non-existent CMS pages)
  const allPageUrls = new Set(pages.map(p => p.url));
  let brokenLinks = 0;

  for (const page of pages) {
    // Check canonical links
    if (page.canonical && page.canonical !== page.url && !page.canonical.startsWith("http")) {
      if (!allPageUrls.has(page.canonical)) {
        brokenLinks++;
      }
    }
  }

  if (brokenLinks > 0) {
    issues.push({
      entityType: "page",
      entityId: 0,
      entitySlug: "global",
      issueType: "broken-link",
      severity: "error",
      message: `${brokenLinks} broken internal links found`,
    });
  }

  const missingMetadata = issues.filter(i => i.issueType === "missing-metadata").length;
  const missingSeo = issues.filter(i => i.issueType === "missing-seo").length;
  const brokenLinkIssues = issues.filter(i => i.issueType === "broken-link").length;
  const duplicateSlugs = issues.filter(i => i.issueType === "duplicate-slug").length;
  const emptyDescriptions = issues.filter(i => i.issueType === "empty-description").length;

  return {
    totalEntities,
    missingMetadata,
    missingSeo,
    brokenLinks: brokenLinkIssues,
    duplicateSlugs,
    emptyDescriptions,
    issues,
  };
}
