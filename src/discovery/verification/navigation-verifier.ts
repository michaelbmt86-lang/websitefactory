// ============================================================================
// NAVIGATION VERIFIER (Verification Engine)
//
// Verifies navigation integrity: main nav, footer nav, broken links.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { VerificationCheck } from "@/types/discovery";

interface DbNav {
  id: number;
  label: string;
  href: string;
  is_external: number;
  parent_id: number | null;
  sort_order: number;
}

export function verifyNavigation(): VerificationCheck {
  const navLinks = db.prepare("SELECT * FROM navigation ORDER BY sort_order").all() as DbNav[];
  const issues: string[] = [];

  if (navLinks.length === 0) {
    return { name: "navigation", status: "WARNING", message: "No navigation links found" };
  }

  let brokenNavLinks = 0;
  let missingLabels = 0;

  for (const nav of navLinks) {
    if (!nav.label) missingLabels++;
    if (!nav.href) {
      brokenNavLinks++;
      continue;
    }
    // Check if internal nav links point to existing pages
    if (!nav.is_external && !nav.href.startsWith("http")) {
      const targetExists = db.prepare("SELECT id FROM cms_pages WHERE url LIKE ? OR slug = ?").get(`%${nav.href}`, nav.href.replace(/^\//, ""));
      if (!targetExists) brokenNavLinks++;
    }
  }

  // Check for duplicate sort orders
  const sortOrders = navLinks.map(n => n.sort_order);
  const dupeSorts = sortOrders.length - new Set(sortOrders).size;
  if (dupeSorts > 0) issues.push(`${dupeSorts} duplicate sort orders`);

  if (brokenNavLinks > 0) issues.push(`${brokenNavLinks} broken navigation links`);
  if (missingLabels > 0) issues.push(`${missingLabels} nav items missing labels`);

  const status = brokenNavLinks > 2 ? "FAILED" : issues.length > 0 ? "WARNING" : "PASS";

  return {
    name: "navigation",
    status,
    message: `${navLinks.length} nav links. ${issues.length} issues.`,
    details: { total: navLinks.length, brokenNavLinks, missingLabels, issues },
  };
}
