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
  private queue: { url: string; depth: number; parentUrl: string | null; source: DiscoverySource }[] = [];

  constructor(baseUrl: string, options: DiscoveryOptions = {}) {
    this.baseUrl = normalizeUrl(baseUrl, baseUrl);
    this.baseOrigin = new URL(baseUrl).origin;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async discover(): Promise<SiteDiscoveryResult> {
    this.clearDatabase();

    // Phase 1: Discover sitemaps and robots.txt
    const robotsTxt = await this.fetchRobotsTxt();
    const sitemapUrls = await discoverSitemaps(this.baseUrl);

    // Phase 2: Crawl sitemaps
    const sitemapEntries = await crawlSitemaps(sitemapUrls);

    // Seed the queue with sitemap entries
    for (const entry of sitemapEntries) {
      if (!this.isInternalUrl(entry.url)) continue;
      const normalized = normalizeUrl(entry.url, this.baseUrl);
      if (!this.visited.has(normalized)) {
        this.queue.push({
          url: normalized,
          depth: 0,
          parentUrl: null,
          source: "xml-sitemap",
        });
      }
    }

    // Phase 3: Crawl the homepage to discover navigation links
    await this.crawlPage(this.baseUrl, 0, null, "header-nav");

    // Phase 4: BFS crawl
    await this.bfsCrawl();

    // Phase 5: Generate results
    return this.generateResults(sitemapUrls, robotsTxt);
  }

  private clearDatabase(): void {
    db.prepare("DELETE FROM site_urls").run();
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

    this.visited.add(normalized);

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
        !this.visited.has(linkNormalized) &&
        !this.isExcludedPath(linkNormalized)
      ) {
        this.queue.push({
          url: linkNormalized,
          depth: depth + 1,
          parentUrl: normalized,
          source: link.source,
        });
      }
    }
  }

  private async bfsCrawl(): Promise<void> {
    const maxDepth = this.options.maxDepth ?? 5;
    const maxPages = this.options.maxPages ?? 500;

    while (this.queue.length > 0 && this.visited.size < maxPages) {
      const batch = this.queue.splice(0, this.options.concurrency ?? 5);
      const validBatch = batch.filter(item => item.depth <= maxDepth);

      await Promise.all(
        validBatch.map(item =>
          this.crawlPage(item.url, item.depth, item.parentUrl, item.source)
        )
      );
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
          status = ?,
          title = CASE WHEN ? != '' THEN ? ELSE title END,
          meta_description = CASE WHEN ? != '' THEN ? ELSE meta_description END,
          canonical_url = CASE WHEN ? IS NOT NULL THEN ? ELSE canonical_url END,
          h1 = CASE WHEN ? != '' THEN ? ELSE h1 END,
          status_code = ?,
          response_time_ms = ?
        WHERE url = ?
      `).run(
        input.status,
        input.title, input.title,
        input.meta_description, input.meta_description,
        input.canonical_url, input.canonical_url,
        input.h1, input.h1,
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
