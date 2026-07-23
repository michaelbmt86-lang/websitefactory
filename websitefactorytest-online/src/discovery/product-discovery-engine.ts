// ============================================================================
// PRODUCT DISCOVERY ENGINE
//
// PIPELINE CONTRACT: Consumes ONLY Discovery output (site_urls table).
// Classifies URLs as product, category, listing, or pagination.
// Writes product_urls into SQLite. MUST NOT crawl, fetch, or open browsers.
// ============================================================================

import db from "@/lib/db";
import type {
  ProductUrl,
  ProductUrlInput,
  ProductDiscoverySource,
  ProductDiscoveryResult,
} from "@/types/discovery";
import { extractProductSlug } from "./product-classifier";

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

// URL patterns that indicate a product page
const PRODUCT_URL_PATTERNS: RegExp[] = [
  /\/products?\//i,
  /\/p\//i,
  /\/item\//i,
  /\/product\//i,
  /\/shop\/[^/]+/i,
  /\/buy\//i,
  /\/detail\//i,
];

// URL patterns that indicate a category/listing page
const CATEGORY_URL_PATTERNS: RegExp[] = [
  /\/categories?\//i,
  /\/collection\//i,
  /\/collections\//i,
  /\/shop\/?$/i,
  /\/catalog\/?$/i,
];

// URL patterns that indicate pagination
const PAGINATION_URL_PATTERNS: RegExp[] = [
  /[?&]page=\d+/i,
  /[?&]p=\d+/i,
  /\/page\/\d+/i,
];

export class ProductDiscoveryEngine {
  private baseUrl: string;
  private baseOrigin: string;
  private options: ProductDiscoveryOptions;
  private visitedProducts = new Map<string, string>(); // canonical/url -> url
  private productSlugs = new Map<string, string>(); // slug -> url (for dedup)

  constructor(baseUrl: string, options: ProductDiscoveryOptions = {}) {
    this.baseUrl = this.normalizeUrl(baseUrl);
    this.baseOrigin = new URL(baseUrl).origin;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async discover(): Promise<ProductDiscoveryResult> {
    const startTimeMs = Date.now();
    console.log("[product-discovery] Starting product discovery for", this.baseUrl);

    // PIPELINE CONTRACT: Read ONLY from Discovery output (site_urls)
    const maxProducts = this.options.maxProducts ?? 5000;
    const siteUrls = db.prepare(`
      SELECT * FROM site_urls
      WHERE status IN ('crawled', 'discovered')
      ORDER BY priority DESC
      LIMIT ?
    `).all(maxProducts) as Array<{
      id: number;
      url: string;
      slug: string;
      page_type: string;
      status: string;
      title: string;
      json_ld: string | null;
    }>;

    console.log(`[product-discovery] Processing ${siteUrls.length} crawled URL(s)...`);

    // Classify each URL and store product URLs
    for (const siteUrl of siteUrls) {
      if (this.visitedProducts.size >= (this.options.maxProducts ?? 5000)) break;

      const classification = this.classifyUrl(siteUrl.url, siteUrl.page_type, siteUrl.json_ld);

      if (classification.isProduct) {
        this.storeProductUrl(
          siteUrl.url,
          siteUrl.url,
          classification.source,
          classification.category,
          siteUrl.title,
        );
      }
    }

    const endTimeMs = Date.now();
    const result = this.generateResults(startTimeMs, endTimeMs);

    console.log(`[product-discovery] Complete: ${result.totalProducts} product(s) found in ${result.discoveryTimeMs}ms`);
    console.log(`[product-discovery]   Categories: ${result.totalCategories}, Duplicates: ${result.duplicatesFound}`);

    return result;
  }

  // -------------------------------------------------------------------------
  // URL Classification — pure classifier, no fetching
  // -------------------------------------------------------------------------

  private classifyUrl(
    url: string,
    pageType: string,
    jsonLd: string | null,
  ): { isProduct: boolean; source: ProductDiscoverySource; category: string } {
    // 1. Classification by Discovery page_type (most reliable)
    if (pageType === "Product Detail") {
      return { isProduct: true, source: "discovery-classification", category: this.extractCategoryFromUrl(url) };
    }

    if (pageType === "Product Listing" || pageType === "Category") {
      // Listing/category pages themselves are not products — they contain product links
      // But we still record them as product-related for downstream processing
      return { isProduct: false, source: "listing-page", category: "" };
    }

    // 2. Classification by URL patterns
    try {
      const pathname = new URL(url).pathname.toLowerCase();

      // Check product URL patterns
      if (PRODUCT_URL_PATTERNS.some(p => p.test(pathname))) {
        return { isProduct: true, source: "url-pattern", category: this.extractCategoryFromUrl(url) };
      }

      // Check category URL patterns (not products)
      if (CATEGORY_URL_PATTERNS.some(p => p.test(pathname))) {
        return { isProduct: false, source: "category-page", category: "" };
      }

      // Check pagination patterns (not products)
      if (PAGINATION_URL_PATTERNS.some(p => p.test(url))) {
        return { isProduct: false, source: "pagination", category: "" };
      }
    } catch {
      // Invalid URL — skip
    }

    // 3. Classification by JSON-LD structured data (if available from Discovery)
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        if (this.hasProductJsonLd(data)) {
          return { isProduct: true, source: "jsonld-classification", category: this.extractCategoryFromJsonLd(data) };
        }
      } catch {
        // Malformed JSON-LD — skip
      }
    }

    // 4. Default: not a product
    return { isProduct: false, source: "none", category: "" };
  }

  private hasProductJsonLd(data: unknown): boolean {
    if (!data || typeof data !== "object") return false;

    const PRODUCT_TYPES = new Set(["Product", "IndividualProduct", "SomeProducts"]);

    if (Array.isArray(data)) {
      return data.some(item => this.hasProductJsonLd(item));
    }

    const obj = data as Record<string, unknown>;
    if (typeof obj["@type"] === "string" && PRODUCT_TYPES.has(obj["@type"])) {
      return true;
    }

    // Check @graph
    if (Array.isArray(obj["@graph"])) {
      return (obj["@graph"] as unknown[]).some(item => this.hasProductJsonLd(item));
    }

    // Check itemListElement
    if (Array.isArray(obj["itemListElement"])) {
      return (obj["itemListElement"] as unknown[]).some(item => this.hasProductJsonLd(item));
    }

    return false;
  }

  private extractCategoryFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const segments = pathname.split("/").filter(Boolean);

      // Common patterns: /category/name, /shop/category/name, /products/category/name
      const categoryIndex = segments.findIndex(s =>
        ["category", "categories", "collection", "collections", "shop"].includes(s.toLowerCase())
      );

      if (categoryIndex !== -1 && categoryIndex + 1 < segments.length) {
        return segments[categoryIndex + 1].replace(/-/g, " ");
      }

      // Fallback: use second-to-last segment
      if (segments.length >= 2) {
        return segments[segments.length - 2].replace(/-/g, " ");
      }
    } catch {
      // Invalid URL
    }

    return "Unknown";
  }

  private extractCategoryFromJsonLd(data: unknown): string {
    if (!data || typeof data !== "object") return "Unknown";

    const obj = data as Record<string, unknown>;

    if (typeof obj["category"] === "string") {
      return obj["category"];
    }

    // Check @graph
    if (Array.isArray(obj["@graph"])) {
      for (const item of obj["@graph"] as unknown[]) {
        const cat = this.extractCategoryFromJsonLd(item);
        if (cat !== "Unknown") return cat;
      }
    }

    // Check itemListElement
    if (Array.isArray(obj["itemListElement"])) {
      for (const item of obj["itemListElement"] as unknown[]) {
        const cat = this.extractCategoryFromJsonLd(item);
        if (cat !== "Unknown") return cat;
      }
    }

    return "Unknown";
  }

  // -------------------------------------------------------------------------
  // Product URL Storage
  // -------------------------------------------------------------------------

  private storeProductUrl(
    url: string,
    sourcePage: string,
    source: ProductDiscoverySource,
    category: string,
    title: string,
  ): void {
    const normalized = this.normalizeUrl(url);

    // Check for duplicates by canonical URL
    if (this.visitedProducts.has(normalized)) return;

    // Check for duplicates by product slug
    const slug = extractProductSlug(normalized);
    if (slug && this.productSlugs.has(slug)) {
      // Mark as duplicate
      const originalUrl = this.productSlugs.get(slug)!;
      this.upsertProductUrl({
        url: normalized,
        category: category || "Unknown",
        product_slug: slug,
        product_name: title || "",
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
      category: category || "Unknown",
      product_slug: slug,
      product_name: title || "",
      source_page: sourcePage,
      discovered_by: source,
      status: "discovered",
      priority: 50,
    });
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

  // -------------------------------------------------------------------------
  // URL normalization
  // -------------------------------------------------------------------------

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, fragment, normalize protocol
      let normalized = parsed.origin + parsed.pathname.replace(/\/$/, "") + parsed.search;
      normalized = normalized.toLowerCase();
      return normalized;
    } catch {
      return url.toLowerCase();
    }
  }

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------

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
      pagesCrawled: 0, // No pages crawled — pure classification
      paginationPagesCrawled: 0, // No pagination followed
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
