// ============================================================================
// PRODUCT DISCOVERY ENGINE
//
// Orchestrates product discovery from site_urls (Phase 1 output).
// Crawls listing/category pages, handles pagination, detects duplicates.
// Reusable — no site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type {
  ProductUrlInput,
  ProductUrl,
  ProductDiscoverySource,
  ProductDiscoveryResult,
} from "@/types/discovery";
import { fetchText } from "./sitemap-parser";
import { extractPageData } from "./page-extractor";
import { normalizeUrl, isInternalUrl } from "./page-classifier";
import { detectPagination, buildPaginationQueue } from "./pagination-handler";
import {
  classifyProduct,
  extractProductSlug,
  extractProductName,
  extractPrice,
  extractSku,
  extractImageUrl,
  checkInStock,
} from "./product-classifier";

interface ProductDiscoveryOptions {
  maxPaginationPages?: number;
  maxProducts?: number;
  concurrency?: number;
}

const DEFAULT_OPTIONS: ProductDiscoveryOptions = {
  maxPaginationPages: 50,
  maxProducts: 5000,
  concurrency: 5,
};

// Patterns to identify product links within listing pages
const PRODUCT_LINK_PATTERNS: RegExp[] = [
  /\/products?\//i,
  /\/p\//i,
  /\/item\//i,
  /\/product\//i,
  /\/shop\//i,
  /\/buy\//i,
  /\/detail\//i,
];

// JSON-LD types that indicate a product
const PRODUCT_JSONLD_TYPES = new Set([
  "Product",
  "IndividualProduct",
  "SomeProducts",
]);

export class ProductDiscoveryEngine {
  private baseUrl: string;
  private baseOrigin: string;
  private options: ProductDiscoveryOptions;
  private visitedUrls = new Set<string>();
  private visitedProducts = new Map<string, string>(); // canonical/url -> url
  private productSlugs = new Map<string, string>(); // slug -> url (for dedup)

  constructor(baseUrl: string, options: ProductDiscoveryOptions = {}) {
    this.baseUrl = normalizeUrl(baseUrl, baseUrl);
    this.baseOrigin = new URL(baseUrl).origin;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async discover(): Promise<ProductDiscoveryResult> {
    const startTimeMs = Date.now();

    // Clear previous product_urls data
    db.prepare("DELETE FROM product_urls").run();

    // Phase 1: Get listing/category pages from site_urls
    const listingPages = this.getListingPages();

    // Phase 2: Crawl each listing page and follow pagination
    for (const listingPage of listingPages) {
      if (this.visitedUrls.size >= (this.options.maxProducts ?? 5000)) break;
      await this.crawlListingPage(listingPage.url, listingPage.pageType);
    }

    // Phase 3: Crawl product detail pages for metadata
    await this.enrichProducts();

    const endTimeMs = Date.now();

    return this.generateResults(startTimeMs, endTimeMs);
  }

  private getListingPages(): { url: string; pageType: string }[] {
    const rows = db.prepare(`
      SELECT url, page_type FROM site_urls
      WHERE page_type IN ('Product Listing', 'Category', 'Search')
        AND status = 'crawled'
      ORDER BY priority DESC
    `).all() as { url: string; page_type: string }[];

    // Also include URLs from site_urls that look like product listing pages
    const additionalPages = db.prepare(`
      SELECT url, page_type FROM site_urls
      WHERE status = 'crawled'
        AND (
          url LIKE '%/products%' OR url LIKE '%/shop%' OR url LIKE '%/collection%'
          OR url LIKE '%/catalog%' OR url LIKE '%/browse%' OR url LIKE '%/store%'
        )
        AND page_type NOT IN ('Product Detail')
      ORDER BY priority DESC
    `).all() as { url: string; page_type: string }[];

    const combined: { url: string; pageType: string }[] = rows.map(r => ({ url: r.url, pageType: r.page_type }));
    const seen = new Set(rows.map(r => r.url));
    for (const page of additionalPages) {
      if (!seen.has(page.url)) {
        combined.push({ url: page.url, pageType: page.page_type });
        seen.add(page.url);
      }
    }

    return combined;
  }

  private async crawlListingPage(url: string, pageType: string): Promise<void> {
    const normalized = normalizeUrl(url, this.baseUrl);
    if (this.visitedUrls.has(normalized)) return;

    this.visitedUrls.add(normalized);

    const html = await fetchText(normalized);
    if (!html) return;

    // Extract product links from the page
    const productLinks = this.extractProductLinks(html, normalized);

    // Store discovered product links
    for (const link of productLinks) {
      this.storeProductUrl(link, normalized, pageType as ProductDiscoverySource);
    }

    // Detect pagination
    const pagination = detectPagination(html, normalized);

    // Follow pagination
    if (pagination.hasNextPage && pagination.nextPageUrl) {
      const paginationUrls = buildPaginationQueue(
        normalized,
        pagination,
        this.options.maxPaginationPages
      );

      for (const paginationUrl of paginationUrls) {
        if (this.visitedUrls.has(paginationUrl)) continue;
        if (this.visitedUrls.size >= (this.options.maxProducts ?? 5000)) break;

        this.visitedUrls.add(paginationUrl);

        const paginationHtml = await fetchText(paginationUrl);
        if (!paginationHtml) continue;

        const paginationProducts = this.extractProductLinks(paginationHtml, paginationUrl);
        for (const link of paginationProducts) {
          this.storeProductUrl(link, normalized, "pagination");
        }

        // Check for more pagination
        const nextPagination = detectPagination(paginationHtml, paginationUrl);
        if (nextPagination.hasNextPage && nextPagination.nextPageUrl) {
          // Recursively follow — but limit depth
          if (this.visitedUrls.size < (this.options.maxProducts ?? 5000)) {
            // Add to a secondary queue for later processing
            // (already handled by buildPaginationQueue generating sequential pages)
          }
        }
      }
    }
  }

  private extractProductLinks(html: string, pageUrl: string): string[] {
    const links = new Set<string>();

    // 1. Extract from anchor tags
    const anchorMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
    for (const match of anchorMatches) {
      const href = match[1];
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;

      try {
        const resolved = new URL(href, pageUrl);
        if (!isInternalUrl(resolved.href, this.baseUrl)) continue;

        const path = resolved.pathname.toLowerCase();

        // Check if it matches product link patterns
        if (PRODUCT_LINK_PATTERNS.some(p => p.test(path))) {
          links.add(normalizeUrl(resolved.href, this.baseUrl));
        }
      } catch {
        // Skip invalid URLs
      }
    }

    // 2. Extract from JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);
        this.extractJsonLdProductUrls(data, pageUrl, links);
      } catch {
        // Skip malformed JSON-LD
      }
    }

    return [...links];
  }

  private extractJsonLdProductUrls(
    data: Record<string, unknown> | unknown[],
    pageUrl: string,
    links: Set<string>
  ): void {
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && typeof item === "object") {
          this.extractJsonLdProductUrls(item as Record<string, unknown>, pageUrl, links);
        }
      }
      return;
    }

    const type = data["@type"];
    if (typeof type === "string" && PRODUCT_JSONLD_TYPES.has(type)) {
      const url = data["url"];
      if (typeof url === "string") {
        links.add(normalizeUrl(url, this.baseUrl));
      }
    }

    // Check itemListElement for collection pages
    const itemList = data["itemListElement"];
    if (Array.isArray(itemList)) {
      for (const item of itemList) {
        if (item && typeof item === "object") {
          const itemData = item as Record<string, unknown>;
          const itemUrl = itemData["url"] || itemData["item"];
          if (typeof itemUrl === "string") {
            const resolved = new URL(itemUrl, this.baseUrl);
            if (isInternalUrl(resolved.href, this.baseUrl)) {
              links.add(normalizeUrl(resolved.href, this.baseUrl));
            }
          }
        }
      }
    }
  }

  private storeProductUrl(
    url: string,
    sourcePage: string,
    source: ProductDiscoverySource
  ): void {
    const normalized = normalizeUrl(url, this.baseUrl);

    // Check for duplicates by canonical URL
    if (this.visitedProducts.has(normalized)) return;

    // Check for duplicates by product slug
    const slug = extractProductSlug(normalized);
    if (slug && this.productSlugs.has(slug)) {
      // Mark as duplicate
      const originalUrl = this.productSlugs.get(slug)!;
      this.upsertProductUrl({
        url: normalized,
        category: "Unknown",
        product_slug: slug,
        product_name: "",
        source_page: sourcePage,
        discovered_by: source,
        status: "duplicate",
        priority: 10,
        is_duplicate: 1,
        duplicate_of: originalUrl,
      });
      return;
    }

    this.visitedProducts.set(normalized, normalized);
    if (slug) this.productSlugs.set(slug, normalized);

    this.upsertProductUrl({
      url: normalized,
      category: "Unknown",
      product_slug: slug,
      product_name: "",
      source_page: sourcePage,
      discovered_by: source,
      status: "discovered",
      priority: 50,
    });
  }

  private async enrichProducts(): Promise<void> {
    const products = db.prepare(`
      SELECT id, url FROM product_urls WHERE status = 'discovered'
    `).all() as { id: number; url: string }[];

    const concurrency = this.options.concurrency ?? 5;
    const batch: { id: number; url: string }[][] = [];

    for (let i = 0; i < products.length; i += concurrency) {
      batch.push(products.slice(i, i + concurrency));
    }

    for (const batchGroup of batch) {
      await Promise.all(
        batchGroup.map(async (product) => {
          try {
            const metadata = await extractPageData(product.url);
            const jsonLd = metadata.jsonLd;

            const productName = extractProductName(jsonLd, metadata.title, metadata.h1);
            const category = classifyProduct(product.url, productName);
            const price = extractPrice(jsonLd);
            const sku = extractSku(jsonLd);
            const imageUrl = extractImageUrl(jsonLd);
            const inStock = checkInStock(jsonLd);

            // Check canonical for dedup
            let isDuplicate = 0;
            let duplicateOf: string | null = null;
            if (metadata.canonical) {
              const canonicalNormalized = normalizeUrl(metadata.canonical, this.baseUrl);
              if (canonicalNormalized !== product.url && this.visitedProducts.has(canonicalNormalized)) {
                isDuplicate = 1;
                duplicateOf = canonicalNormalized;
              }
            }

            // Update product with enriched data
            db.prepare(`
              UPDATE product_urls SET
                product_name = ?,
                category = ?,
                price = ?,
                sku = ?,
                image_url = ?,
                in_stock = ?,
                canonical_url = ?,
                json_ld = ?,
                status = 'crawled',
                is_duplicate = CASE WHEN ? = 1 THEN 1 ELSE is_duplicate END,
                duplicate_of = CASE WHEN ? IS NOT NULL THEN ? ELSE duplicate_of END
              WHERE id = ?
            `).run(
              productName,
              category,
              price,
              sku,
              imageUrl,
              inStock ? 1 : 0,
              metadata.canonical,
              jsonLd ? JSON.stringify(jsonLd) : null,
              isDuplicate,
              duplicateOf,
              duplicateOf,
              product.id
            );
          } catch {
            db.prepare("UPDATE product_urls SET status = 'failed' WHERE id = ?").run(product.id);
          }
        })
      );
    }
  }

  private upsertProductUrl(input: ProductUrlInput): void {
    const existing = db.prepare("SELECT id FROM product_urls WHERE url = ?").get(input.url) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE product_urls SET
          status = CASE WHEN ? = 'discovered' AND status != 'discovered' THEN status ELSE ? END,
          discovered_by = CASE WHEN discovered_by != ? THEN discovered_by || ',' || ? ELSE discovered_by END
        WHERE url = ?
      `).run(input.status, input.status, input.discovered_by, input.discovered_by, input.url);
    } else {
      db.prepare(`
        INSERT INTO product_urls (url, category, product_slug, product_name, source_page, discovered_by, status, priority, is_duplicate, duplicate_of)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.url,
        input.category || "Unknown",
        input.product_slug || "",
        input.product_name || "",
        input.source_page || "",
        input.discovered_by,
        input.status,
        input.priority || 50,
        input.is_duplicate || 0,
        input.duplicate_of || null
      );
    }
  }

  private generateResults(startTimeMs: number, endTimeMs: number): ProductDiscoveryResult {
    const allProducts = db.prepare("SELECT * FROM product_urls").all() as ProductUrl[];

    const productsByCategory: Record<string, number> = {};
    const productsByStatus: Record<string, number> = {};
    let duplicatesFound = 0;
    let brokenProducts = 0;

    for (const p of allProducts) {
      productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
      productsByStatus[p.status] = (productsByStatus[p.status] || 0) + 1;
      if (p.is_duplicate) duplicatesFound++;
      if (p.status === "broken") brokenProducts++;
    }

    // Find listing pages with product counts
    const listingPageCounts = db.prepare(`
      SELECT source_page, COUNT(*) as count FROM product_urls
      WHERE source_page != '' AND is_duplicate = 0
      GROUP BY source_page ORDER BY count DESC
    `).all() as { source_page: string; count: number }[];

    return {
      siteUrl: this.baseUrl,
      discoveredAt: new Date().toISOString(),
      startTimeMs,
      endTimeMs,
      discoveryTimeMs: endTimeMs - startTimeMs,
      totalProducts: allProducts.filter(p => !p.is_duplicate).length,
      totalCategories: Object.keys(productsByCategory).length,
      productsByCategory,
      duplicatesFound,
      brokenProducts,
      pagesCrawled: this.visitedUrls.size,
      paginationPagesCrawled: Math.max(0, this.visitedUrls.size - listingPageCounts.length),
      maxDepth: 0,
      listingPages: listingPageCounts.map(l => l.source_page),
      categoryPages: [],
      topProducts: allProducts
        .filter(p => !p.is_duplicate)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 20),
    };
  }
}

export async function discoverProducts(
  baseUrl: string,
  options?: ProductDiscoveryOptions
): Promise<ProductDiscoveryResult> {
  const engine = new ProductDiscoveryEngine(baseUrl, options);
  return engine.discover();
}
