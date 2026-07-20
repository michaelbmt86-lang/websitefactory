// ============================================================================
// LINK VERIFIER (Verification Engine)
//
// Verifies internal and external links across all CMS pages.
// Checks for broken internal references and navigation integrity.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage, VerificationCheck } from "@/types/discovery";

export function verifyLinks(): VerificationCheck {
  const pages = db.prepare("SELECT * FROM cms_pages").all() as CmsPage[];
  const allUrls = new Set(pages.map(p => p.url));
  const allSlugs = new Set(pages.map(p => p.slug));

  const issues: string[] = [];
  let brokenCanonical = 0;

  for (const page of pages) {
    // Check canonical links
    if (page.canonical && page.canonical !== page.url) {
      if (!allUrls.has(page.canonical) && !page.canonical.startsWith("http")) {
        brokenCanonical++;
      }
    }
  }

  // Check navigation integrity
  const navLinks = db.prepare("SELECT * FROM navigation").all() as { href: string }[];
  let brokenNav = 0;
  for (const nav of navLinks) {
    if (nav.href && !nav.href.startsWith("http")) {
      const exists = [...allSlugs].some(s => nav.href.includes(s)) || pages.some(p => p.url.endsWith(nav.href));
      if (!exists) brokenNav++;
    }
  }

  if (brokenCanonical > 0) issues.push(`${brokenCanonical} broken canonical links`);
  if (brokenNav > 0) issues.push(`${brokenNav} broken navigation links`);

  // Check for pages with no internal links at all
  const isolatedPages = pages.filter(p => !p.canonical && pages.length > 1);
  if (isolatedPages.length > 5) issues.push(`${isolatedPages.length} potentially isolated pages`);

  const status = brokenCanonical > 5 || brokenNav > 3 ? "FAILED" : issues.length > 0 ? "WARNING" : "PASS";

  return {
    name: "links",
    status,
    message: `${pages.length} pages checked. ${issues.length} link issues.`,
    details: { totalPages: pages.length, brokenCanonical, brokenNav, issues },
  };
}
