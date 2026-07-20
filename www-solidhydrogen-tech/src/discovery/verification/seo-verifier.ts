// ============================================================================
// SEO VERIFIER (Verification Engine)
//
// Verifies SEO metadata coverage: meta titles, descriptions, OG tags,
// canonical URLs, structured data. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage, CmsSeoPage, VerificationCheck } from "@/types/discovery";

export function verifySeo(): VerificationCheck {
  const pages = db.prepare("SELECT * FROM cms_pages WHERE status = 'published'").all() as CmsPage[];
  const seoEntries = db.prepare("SELECT * FROM cms_seo").all() as CmsSeoPage[];

  const total = pages.length;
  if (total === 0) {
    return { name: "seo", status: "WARNING", message: "No published pages to verify SEO" };
  }

  const issues: string[] = [];

  // Check meta titles
  const noMetaTitle = pages.filter(p => !p.meta_title);
  if (noMetaTitle.length > 0) issues.push(`${noMetaTitle.length} pages missing meta title`);

  // Check meta descriptions
  const noMetaDesc = pages.filter(p => !p.meta_description);
  if (noMetaDesc.length > 0) issues.push(`${noMetaDesc.length} pages missing meta description`);

  // Check OG tags
  const noOgTitle = pages.filter(p => !p.og_title);
  if (noOgTitle.length > 0) issues.push(`${noOgTitle.length} pages missing OG title`);

  const noOgDesc = pages.filter(p => !p.og_description);
  if (noOgDesc.length > 0) issues.push(`${noOgDesc.length} pages missing OG description`);

  // Check canonical
  const noCanonical = pages.filter(p => !p.canonical);
  if (noCanonical.length > 0) issues.push(`${noCanonical.length} pages missing canonical`);

  // Check schema
  const noSchema = pages.filter(p => {
    try { return JSON.parse(p.schema_json || "[]").length === 0; } catch { return true; }
  });
  if (noSchema.length > 0) issues.push(`${noSchema.length} pages missing structured data`);

  const withMeta = total - noMetaTitle.length - noMetaDesc.length;
  const coverage = total > 0 ? Math.round((withMeta / total) * 100) : 0;

  const status = coverage >= 90 ? "PASS" : coverage >= 60 ? "WARNING" : "FAILED";

  return {
    name: "seo",
    status,
    message: `SEO coverage: ${coverage}% (${seoEntries.length} entries). ${issues.length} issues.`,
    details: { total, coverage, seoEntries: seoEntries.length, issues },
  };
}
