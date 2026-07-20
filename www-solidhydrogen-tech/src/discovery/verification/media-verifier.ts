// ============================================================================
// MEDIA VERIFIER (Verification Engine)
//
// Verifies media assets: images, downloads, thumbnails, broken references.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { MediaAsset, VerificationCheck } from "@/types/discovery";

export function verifyMedia(): VerificationCheck {
  const assets = db.prepare("SELECT * FROM media_assets").all() as MediaAsset[];
  const total = assets.length;

  if (total === 0) {
    return { name: "media", status: "WARNING", message: "No media assets found" };
  }

  const issues: string[] = [];

  // Check for assets without URLs
  const noUrl = assets.filter(a => !a.url);
  if (noUrl.length > 0) issues.push(`${noUrl.length} assets without URLs`);

  // Check for orphaned assets (product_id references non-existent product)
  const orphans = db.prepare(`
    SELECT ma.id FROM media_assets ma
    LEFT JOIN extracted_products ep ON ma.product_id = ep.id
    WHERE ep.id IS NULL
  `).all() as { id: number }[];
  if (orphans.length > 0) issues.push(`${orphans.length} orphaned media assets`);

  // Check for duplicate hashes
  const hashCounts = new Map<string, number>();
  for (const a of assets) {
    if (a.hash) hashCounts.set(a.hash, (hashCounts.get(a.hash) || 0) + 1);
  }
  const dupeHashes = [...hashCounts.entries()].filter(([, c]) => c > 1);
  if (dupeHashes.length > 0) issues.push(`${dupeHashes.length} duplicate media hashes`);

  // Check by type
  const byType: Record<string, number> = {};
  for (const a of assets) {
    byType[a.type] = (byType[a.type] || 0) + 1;
  }

  const status = issues.length === 0 ? "PASS" : issues.length <= 2 ? "WARNING" : "FAILED";

  return {
    name: "media",
    status,
    message: `${total} media assets. ${issues.length} issues.`,
    details: { total, byType, issues, orphans: orphans.length, dupeHashes: dupeHashes.length },
  };
}
