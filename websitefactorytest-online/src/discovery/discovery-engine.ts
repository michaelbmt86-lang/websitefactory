// ============================================================================
// DISCOVERY ENGINE (Site Discovery Engine)
//
// Main orchestrator — coordinates sitemap parsing, page extraction,
// URL graph building, and page classification.
// Reusable — no site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type {
  SiteUrlInput,
  SiteUrl,
  PageType,
  DiscoverySource,
  SiteDiscoveryResult,
} from "@/types/discovery";
import {
  discoverSitemaps,
  crawlSitemaps,
  fetchText,
  parseRobotsTxt,
} from "./sitemap-parser";
import { extractPageData, fetchPageStatus } from "./page-extractor";
import {
  classifyUrlByPath,
  classifyByContent,
  normalizeUrl,
  extractSlug,
  isInternalUrl,
} from "./page-classifier";

interface DiscoveryOptions {
  maxDepth?: number;
  maxPages?: number;
  concurrency?: number;
  skipBroken?: boolean;
}

const DEFAULT_OPTIONS: DiscoveryOptions = {
  maxDepth: 5,
  maxPages: 500,
  concurrency: 5,
  skipBroken: true,
};

export class DiscoveryEngine {
  private baseUrl: string;
  private baseOrigin: string;
  private options: DiscoveryOptions;
  private visited = new Set<string>();
  private queued = new Set<string>();
  private queue: { url: string; depth: number; parentUrl: string | null; source: DiscoverySource }[] = [];

  constructor(baseUrl: string, options: DiscoveryOptions = {}) {
    this.baseUrl = normalizeUrl(baseUrl, baseUrl);
    this.baseOrigin = new URL(baseUrl).origin;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async discover(): Promise<SiteDiscoveryResult> {
    const startTimeMs = Date.now();
    console.log("[discovery] Starting site discovery for", this.baseUrl);

    // Phase 1: Discover sitemaps and robots.txt
    console.log("[discovery] Phase 1/5: Discovering sitemaps...");
    const robotsTxt = await this.fetchRobotsTxt();
    const sitemapUrls = await discoverSitemaps(this.baseUrl);
    console.log(`[discovery] Found ${sitemapUrls.length} sitemap(s)`);

    // Phase 2: Crawl sitemaps
    console.log("[discovery] Phase 2/5: Crawling sitemaps...");
    const sitemapEntries = await crawlSitemaps(sitemapUrls);
    console.log(`[discovery] Crawled ${sitemapEntries.length} URL(s) from sitemaps`);

    // Seed the queue with sitemap entries
    for (const entry of sitemapEntries) {
      if (!this.isInternalUrl(entry.url)) continue;
      const normalized = normalizeUrl(entry.url, this.baseUrl);
      if (!this.queued.has(normalized)) {
        this.queue.push({
          url: normalized,
          depth: 0,
          parentUrl: null,
          source: "xml-sitemap",
        });
        this.queued.add(normalized);
      }
    }

    // Phase 3: Crawl the homepage to discover navigation links
    console.log("[discovery] Phase 3/5: Crawling homepage...");
    try {
      await this.crawlPage(this.baseUrl, 0, null, "header-nav");
    } catch (err) {
      console.warn("[discovery] Homepage crawl failed:", err instanceof Error ? err.message : err);
    }

    // Phase 4: BFS crawl
    console.log("[discovery] Phase 4/5: BFS crawl starting...");
    await this.bfsCrawl();

    // Phase 5: Generate results
    console.log("[discovery] Phase 5/5: Generating results...");
    const result = this.generateResults(sitemapUrls, robotsTxt);
    const elapsed = Date.now() - startTimeMs;
    console.log(`[discovery] Complete: ${result.totalUrls} URL(s) discovered in ${elapsed}ms`);
    console.log(`[discovery]   Broken: ${result.brokenUrls.length}, Types: ${Object.keys(result.urlsByType).length}`);

    return result;
  }

  private async fetchRobotsTxt() {
    const content = await fetchText(`${this.baseOrigin}/robots.txt`);
    if (content) return parseRobotsTxt(content);
    return null;
  }

  private isInternalUrl(url: string): boolean {
    return isInternalUrl(url, this.baseUrl);
  }

  private async crawlPage(
    url: string,
    depth: number,
    parentUrl: string | null,
    source: DiscoverySource
  ): Promise<void> {
    const normalized = normalizeUrl(url, this.baseUrl);

    if (this.visited.has(normalized)) return;
    if (this.visited.size >= (this.options.maxPages ?? 500)) return;

    // Classify by path first
    let pageType = classifyUrlByPath(normalized, this.baseUrl);

    // Extract page data
    const metadata = await extractPageData(normalized);
    const { statusCode, responseTimeMs } = await fetchPageStatus(normalized);

    // Refine classification with content
    if (pageType === "Unknown") {
      pageType = classifyByContent(normalized, this.baseUrl, {
        title: metadata.title,
        h1: metadata.h1,
        jsonLd: metadata.jsonLd,
      });
    }

    // Determine status
    const status = statusCode >= 200 && statusCode < 400 ? "crawled" : "broken";

    // Store in database
    const slug = extractSlug(normalized, this.baseUrl);
    const priority = this.calculatePriority(pageType, depth);

    this.upsertUrl({
      url: normalized,
      slug,
      depth,
      parent_url: parentUrl,
      page_type: pageType,
      status,
      priority,
      discovered_by: source,
      title: metadata.title,
      meta_description: metadata.metaDescription,
      canonical_url: metadata.canonical,
      h1: metadata.h1,
      internal_links: metadata.internalLinks.length,
      external_links: metadata.externalLinks.length,
      images: metadata.images.length,
      json_ld: metadata.jsonLd ? JSON.stringify(metadata.jsonLd) : null,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
    });

    this.visited.add(normalized);

    // Enqueue discovered internal links
    const allLinks = [
      ...metadata.headerNavLinks.map(l => ({ href: l.href, source: "header-nav" as DiscoverySource })),
      ...metadata.footerNavLinks.map(l => ({ href: l.href, source: "footer-nav" as DiscoverySource })),
      ...metadata.internalLinks.map(l => ({ href: l, source: "page-body" as DiscoverySource })),
    ];

    for (const link of allLinks) {
      const linkNormalized = normalizeUrl(link.href, this.baseUrl);
      if (
        this.isInternalUrl(linkNormalized) &&
        !this.queued.has(linkNormalized) &&
        !this.isExcludedPath(linkNormalized)
      ) {
        this.queue.push({
          url: linkNormalized,
          depth: depth + 1,
          parentUrl: normalized,
          source: link.source,
        });
        this.queued.add(linkNormalized);
      }
    }
  }

  private async bfsCrawl(): Promise<void> {
    const maxDepth = this.options.maxDepth ?? 5;
    const maxPages = this.options.maxPages ?? 500;
    const errors: { url: string; error: string }[] = [];

    while (this.queue.length > 0 && this.visited.size < maxPages) {
      const batch = this.queue.splice(0, this.options.concurrency ?? 5);
      const validBatch = batch.filter(item => item.depth <= maxDepth);

      await Promise.all(
        validBatch.map(async (item) => {
          try {
            await this.crawlPage(item.url, item.depth, item.parentUrl, item.source);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            errors.push({ url: item.url, error: errorMsg });
            console.warn(`[discovery] Failed to crawl ${item.url}: ${errorMsg}`);
          }
        })
      );
    }

    if (errors.length > 0) {
      console.warn(`[discovery] ${errors.length} URL(s) failed during crawl`);
    }
  }

  private isExcludedPath(url: string): boolean {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.toLowerCase();

      const excludeExtensions = [
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
        ".pdf", ".zip", ".tar", ".gz",
        ".css", ".js", ".mjs",
        ".mp4", ".mp3", ".avi", ".mov", ".webm",
        ".woff", ".woff2", ".ttf", ".eot",
      ];

      return excludeExtensions.some(ext => pathname.endsWith(ext));
    } catch {
      return true;
    }
  }

  private calculatePriority(pageType: PageType, depth: number): number {
    const typePriorities: Record<PageType, number> = {
      "Home": 100,
      "Category": 90,
      "Product Listing": 85,
      "Product Detail": 80,
      "Blog": 75,
      "Article": 70,
      "Landing": 65,
      "Contact": 60,
      "Policy": 50,
      "Search": 30,
      "Tag": 35,
      "Author": 40,
      "Archive": 25,
      "Dashboard": 10,
      "Login": 5,
      "Unknown": 45,
    };

    const basePriority = typePriorities[pageType] ?? 50;
    const depthPenalty = depth * 5;
    return Math.max(1, basePriority - depthPenalty);
  }

  private upsertUrl(input: SiteUrlInput): void {
    const existing = db.prepare("SELECT id FROM site_urls WHERE url = ?").get(input.url) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE site_urls SET
          depth = ?,
          parent_url = CASE WHEN ? IS NOT NULL THEN ? ELSE parent_url END,
          page_type = ?,
          status = ?,
          priority = ?,
          discovered_by = CASE WHEN discovered_by != ? THEN discovered_by || ',' || ? ELSE discovered_by END,
          title = CASE WHEN ? != '' THEN ? ELSE title END,
          meta_description = CASE WHEN ? != '' THEN ? ELSE meta_description END,
          canonical_url = CASE WHEN ? IS NOT NULL THEN ? ELSE canonical_url END,
          h1 = CASE WHEN ? != '' THEN ? ELSE h1 END,
          internal_links = ?,
          external_links = ?,
          images = ?,
          json_ld = CASE WHEN ? IS NOT NULL THEN ? ELSE json_ld END,
          status_code = ?,
          response_time_ms = ?
        WHERE url = ?
      `).run(
        input.depth,
        input.parent_url, input.parent_url,
        input.page_type,
        input.status,
        input.priority,
        input.discovered_by, input.discovered_by,
        input.title, input.title,
        input.meta_description, input.meta_description,
        input.canonical_url, input.canonical_url,
        input.h1, input.h1,
        input.internal_links || 0,
        input.external_links || 0,
        input.images || 0,
        input.json_ld, input.json_ld,
        input.status_code,
        input.response_time_ms,
        input.url
      );
    } else {
      db.prepare(`
        INSERT INTO site_urls (url, slug, depth, parent_url, page_type, status, priority, discovered_by, title, meta_description, canonical_url, h1, internal_links, external_links, images, json_ld, status_code, response_time_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.url, input.slug, input.depth, input.parent_url,
        input.page_type, input.status, input.priority, input.discovered_by,
        input.title || "", input.meta_description || "", input.canonical_url,
        input.h1 || "", input.internal_links || 0, input.external_links || 0,
        input.images || 0, input.json_ld, input.status_code, input.response_time_ms
      );
    }
  }

  private generateResults(sitemapUrls: string[], robotsTxt: ReturnType<typeof parseRobotsTxt> | null): SiteDiscoveryResult {
    const allUrls = db.prepare("SELECT * FROM site_urls").all() as SiteUrl[];

    const urlsByType: Record<string, number> = {};
    const urlsByStatus: Record<string, number> = {};
    const depthStats: Record<number, number> = {};
    const brokenUrls: { url: string; statusCode: number | null; parentUrl: string | null }[] = [];

    for (const url of allUrls) {
      urlsByType[url.page_type] = (urlsByType[url.page_type] || 0) + 1;
      urlsByStatus[url.status] = (urlsByStatus[url.status] || 0) + 1;
      depthStats[url.depth] = (depthStats[url.depth] || 0) + 1;

      if (url.status === "broken") {
        brokenUrls.push({
          url: url.url,
          statusCode: url.status_code,
          parentUrl: url.parent_url,
        });
      }
    }

    return {
      siteUrl: this.baseUrl,
      discoveredAt: new Date().toISOString(),
      totalUrls: allUrls.length,
      maxDepth: Math.max(...Object.keys(depthStats).map(Number), 0),
      urlsByType: urlsByType as Record<PageType, number>,
      urlsByStatus: urlsByStatus as Record<string, number>,
      brokenUrls,
      depthStats,
      topPages: allUrls.sort((a, b) => b.priority - a.priority).slice(0, 20),
      sitemaps: sitemapUrls,
      robotsTxt,
    };
  }
}

// Convenience function for single-use discovery
export async function discoverSite(
  baseUrl: string,
  options?: DiscoveryOptions
): Promise<SiteDiscoveryResult> {
  const engine = new DiscoveryEngine(baseUrl, options);
  return engine.discover();
}
