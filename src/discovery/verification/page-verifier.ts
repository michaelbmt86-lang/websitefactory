// ============================================================================
// PAGE VERIFIER (Verification Engine)
//
// Verifies generated CMS pages: existence, metadata, slug uniqueness.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage, VerificationCheck } from "@/types/discovery";

export function verifyPages(): VerificationCheck {
  const pages = db.prepare("SELECT * FROM cms_pages").all() as CmsPage[];
  const total = pages.length;

  if (total === 0) {
    return { name: "pages", status: "FAILED", message: "No CMS pages found" };
  }

  const issues: string[] = [];

  // Check for pages without titles
  const noTitle = pages.filter(p => !p.title);
  if (noTitle.length > 0) issues.push(`${noTitle.length} pages missing title`);

  // Check for duplicate slugs
  const slugCounts = new Map<string, number>();
  for (const p of pages) {
    slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
  }
  const dupeSlugs = [...slugCounts.entries()].filter(([, c]) => c > 1);
  if (dupeSlugs.length > 0) issues.push(`${dupeSlugs.length} duplicate slugs`);

  // Check for pages without URLs
  const noUrl = pages.filter(p => !p.url);
  if (noUrl.length > 0) issues.push(`${noUrl.length} pages missing URL`);

  const status = issues.length === 0 ? "PASS" : issues.length <= 3 ? "WARNING" : "FAILED";

  return {
    name: "pages",
    status,
    message: issues.length === 0 ? `${total} pages verified successfully` : `${issues.length} issues found: ${issues.join("; ")}`,
    details: { total, issues, dupeSlugs: dupeSlugs.length },
  };
}
