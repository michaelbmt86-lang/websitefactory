// ============================================================================
// MEDIA EXTRACTOR
//
// Extracts all media assets from a product page: images, videos, PDFs,
// downloads. Resolves relative URLs. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { MediaAssetInput, ProductImage, ProductDownload, ProductVideo } from "@/types/discovery";
import { extractImages, extractVideos, extractDownloads } from "./dom-extractor";

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function extractAllMedia(
  html: string,
  baseUrl: string,
  productId: number
): { images: ProductImage[]; videos: ProductVideo[]; downloads: ProductDownload[]; mediaCount: number } {
  const images = extractImages(html, baseUrl);
  const videos = extractVideos(html, baseUrl);
  const downloads = extractDownloads(html, baseUrl);

  // Store media assets in DB
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO media_assets (product_id, type, url, alt, width, height, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let mediaCount = 0;

  for (const img of images) {
    const hash = simpleHash(img.url);
    insertStmt.run(productId, "image", img.url, img.alt, img.width, img.height, hash);
    mediaCount++;
  }

  for (const vid of videos) {
    const hash = simpleHash(vid.url);
    insertStmt.run(productId, "video", vid.url, vid.title, null, null, hash);
    mediaCount++;
  }

  for (const dl of downloads) {
    const hash = simpleHash(dl.url);
    const type = dl.type === "pdf" ? "pdf" : "download";
    insertStmt.run(productId, type, dl.url, dl.title, null, null, hash);
    mediaCount++;
  }

  // Extract thumbnail (first small image or og:image)
  const thumbMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (thumbMatch) {
    const thumbUrl = resolveUrl(thumbMatch[1], baseUrl);
    if (thumbUrl) {
      const hash = simpleHash(thumbUrl);
      insertStmt.run(productId, "thumbnail", thumbUrl, "", null, null, hash);
      mediaCount++;
    }
  }

  return { images, videos, downloads, mediaCount };
}

export function getMediaAssetsForProduct(productId: number): MediaAssetInput[] {
  return db.prepare("SELECT * FROM media_assets WHERE product_id = ?").all(productId) as MediaAssetInput[];
}

export function getAllMediaAssets(): (MediaAssetInput & { id: number })[] {
  return db.prepare(`
    SELECT ma.*, ep.slug as product_slug
    FROM media_assets ma
    JOIN extracted_products ep ON ma.product_id = ep.id
    ORDER BY ma.type, ma.url
  `).all() as (MediaAssetInput & { id: number; product_slug: string })[];
}
