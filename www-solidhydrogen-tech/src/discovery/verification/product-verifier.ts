// ============================================================================
// PRODUCT VERIFIER (Verification Engine)
//
// Verifies extracted products: existence, completeness, duplicates.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { ExtractedProduct, VerificationCheck } from "@/types/discovery";

export function verifyProducts(): VerificationCheck {
  const products = db.prepare("SELECT * FROM extracted_products").all() as ExtractedProduct[];
  const total = products.length;

  if (total === 0) {
    return { name: "products", status: "WARNING", message: "No extracted products found" };
  }

  const completed = products.filter(p => p.status === "completed");
  const failed = products.filter(p => p.status === "failed");
  const issues: string[] = [];

  // Check for products without images
  const noImages = completed.filter(p => {
    try { return JSON.parse(p.images_json || "[]").length === 0; } catch { return true; }
  });
  if (noImages.length > 0) issues.push(`${noImages.length} products without images`);

  // Check for products without titles
  const noTitle = completed.filter(p => !p.title);
  if (noTitle.length > 0) issues.push(`${noTitle.length} products without titles`);

  // Check for duplicate URLs
  const urlSet = new Set<string>();
  let dupes = 0;
  for (const p of products) {
    if (urlSet.has(p.url)) dupes++;
    urlSet.add(p.url);
  }
  if (dupes > 0) issues.push(`${dupes} duplicate product URLs`);

  // Check for products without SEO
  const noSeo = completed.filter(p => {
    try { const s = JSON.parse(p.seo_json || "{}"); return !s.title && !s.metaDescription; } catch { return true; }
  });
  if (noSeo.length > 0) issues.push(`${noSeo.length} products without SEO`);

  const status = failed.length > total * 0.5 ? "FAILED" : issues.length > 5 ? "WARNING" : "PASS";

  return {
    name: "products",
    status,
    message: `${completed.length}/${total} products extracted. ${issues.length} issues.`,
    details: { total, completed: completed.length, failed: failed.length, issues, dupes },
  };
}
