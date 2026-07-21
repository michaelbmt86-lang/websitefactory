// ============================================================================
// SITEMAP PARSER (Site Discovery Engine)
//
// Parses robots.txt, sitemap.xml, and sitemap_index.xml.
// Reusable — no site-specific logic.
// ============================================================================

import type { RobotsTxtResult, SitemapEntry } from "@/types/discovery";
import { extractWithRecovery } from "./extraction/extraction-manager";

export async function fetchText(url: string): Promise<string | null> {
  try {
    const result = await extractWithRecovery(url, { timeoutMs: 15000, maxRetriesPerEngine: 1 });
    if (!result.success || !result.html) return null;
    return result.html;
  } catch {
    return null;
  }
}

export async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "WebsiteFactory-Discovery/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function parseRobotsTxt(content: string): RobotsTxtResult {
  const sitemaps: string[] = [];
  const disallowedPaths: string[] = [];
  let crawlDelay: number | null = null;

  const lines = content.split("\n");
  let inUserAgent = false;

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    if (lower.startsWith("user-agent:")) {
      const agent = line.substring(11).trim();
      inUserAgent = agent === "*" || agent === "";
    }

    if (inUserAgent) {
      if (lower.startsWith("sitemap:")) {
        sitemaps.push(line.substring(8).trim());
      }
      if (lower.startsWith("disallow:")) {
        const path = line.substring(9).trim();
        if (path) disallowedPaths.push(path);
      }
      if (lower.startsWith("crawl-delay:")) {
        const delay = parseFloat(line.substring(12).trim());
        if (!isNaN(delay)) crawlDelay = delay;
      }
    }
  }

  return { sitemaps, disallowedPaths, crawlDelay };
}

export async function discoverSitemaps(siteUrl: string): Promise<string[]> {
  const baseUrl = new URL(siteUrl);
  const origin = baseUrl.origin;
  const sitemapUrls: string[] = [];

  // 1. Try robots.txt
  const robotsText = await fetchText(`${origin}/robots.txt`);
  if (robotsText) {
    const robots = parseRobotsTxt(robotsText);
    sitemapUrls.push(...robots.sitemaps);
  }

  // 2. Try common sitemap locations
  const commonPaths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap-index.xml",
    "/sitemapindex.xml",
    "/sitemaps.xml",
  ];

  for (const p of commonPaths) {
    const url = `${origin}${p}`;
    if (!sitemapUrls.includes(url)) {
      const text = await fetchText(url);
      if (text && text.includes("<urlset") || text?.includes("<sitemapindex")) {
        sitemapUrls.push(url);
      }
    }
  }

  return [...new Set(sitemapUrls)];
}

export function parseSitemapXml(content: string): { entries: SitemapEntry[]; childSitemaps: string[] } {
  const entries: SitemapEntry[] = [];
  const childSitemaps: string[] = [];

  // Check if it's a sitemap index
  if (content.includes("<sitemapindex")) {
    const sitemapMatches = content.matchAll(/<sitemap[\s>][\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi);
    for (const match of sitemapMatches) {
      const loc = match[1]?.trim();
      if (loc) childSitemaps.push(loc);
    }
    return { entries, childSitemaps };
  }

  // Parse regular sitemap
  const urlMatches = content.matchAll(/<url[\s>][\s\S]*?<loc>([\s\S]*?)<\/loc>([\s\S]*?)<\/url>/gi);
  for (const match of urlMatches) {
    const loc = match[1]?.trim();
    const rest = match[2] || "";

    if (!loc) continue;

    const lastmodMatch = rest.match(/<lastmod>([\s\S]*?)<\/lastmod>/i);
    const changefreqMatch = rest.match(/<changefreq>([\s\S]*?)<\/changefreq>/i);
    const priorityMatch = rest.match(/<priority>([\s\S]*?)<\/priority>/i);

    entries.push({
      url: loc,
      lastmod: lastmodMatch?.[1]?.trim() || null,
      changefreq: changefreqMatch?.[1]?.trim() || null,
      priority: parseFloat(priorityMatch?.[1]?.trim() || "0.5"),
    });
  }

  return { entries, childSitemaps };
}

export async function crawlSitemaps(sitemapUrls: string[]): Promise<SitemapEntry[]> {
  const allEntries: SitemapEntry[] = [];
  const visited = new Set<string>();
  const queue = [...sitemapUrls];

  while (queue.length > 0) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const content = await fetchText(url);
    if (!content) continue;

    const { entries, childSitemaps } = parseSitemapXml(content);
    allEntries.push(...entries);

    for (const child of childSitemaps) {
      if (!visited.has(child)) queue.push(child);
    }
  }

  return allEntries;
}
