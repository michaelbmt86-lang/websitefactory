// ============================================================================
// PAGE EXTRACTOR (Site Discovery Engine)
//
// Extracts header nav, footer nav, mega menu, breadcrumbs, JSON-LD, canonical,
// meta tags, and all links from a page. Reusable — no site-specific logic.
// ============================================================================

import type {
  PageMetadata,
  HeaderNavLink,
  FooterNavLink,
  BreadcrumbItem,
  MegaMenuData,
} from "@/types/discovery";
import { fetchText } from "./sitemap-parser";

function parseHtml(html: string): {
  title: string;
  metaDescription: string;
  canonical: string | null;
  h1: string;
  jsonLd: Record<string, unknown> | null;
  internalLinks: string[];
  externalLinks: string[];
  images: string[];
  headerNavLinks: HeaderNavLink[];
  footerNavLinks: FooterNavLink[];
  breadcrumbs: BreadcrumbItem[];
  megaMenus: MegaMenuData[];
} {
  const title = extractBetween(html, "<title>", "</title>") || "";
  const metaDescription = extractMetaContent(html, "description") || "";
  const canonical = extractLinkHref(html, "canonical");

  // H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? stripTags(h1Match[1]).trim() : "";

  // JSON-LD
  let jsonLd: Record<string, unknown> | null = null;
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed["@type"] && !Array.isArray(parsed["@type"])) {
        jsonLd = parsed;
        break;
      }
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]["@type"]) {
        jsonLd = parsed[0] as Record<string, unknown>;
        break;
      }
      if (!jsonLd) jsonLd = parsed as Record<string, unknown>;
    } catch {
      // Skip malformed JSON-LD
    }
  }

  // All anchor links
  const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  for (const match of linkMatches) {
    const href = match[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (href.startsWith("http")) {
      externalLinks.push(href);
    } else {
      internalLinks.push(href);
    }
  }

  // Images
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  const images: string[] = [];
  for (const match of imgMatches) {
    if (match[1] && !match[1].startsWith("data:")) {
      images.push(match[1]);
    }
  }

  // Header navigation — try multiple selectors
  const headerNavLinks = extractHeaderNav(html);

  // Footer navigation
  const footerNavLinks = extractFooterNav(html);

  // Breadcrumbs
  const breadcrumbs = extractBreadcrumbs(html);

  // Mega menus
  const megaMenus = extractMegaMenus(html);

  return {
    title,
    metaDescription,
    canonical,
    h1,
    jsonLd,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
    images: [...new Set(images)],
    headerNavLinks,
    footerNavLinks,
    breadcrumbs,
    megaMenus,
  };
}

function extractBetween(html: string, start: string, end: string): string {
  const s = html.indexOf(start);
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return "";
  return html.substring(s + start.length, e);
}

function extractMetaContent(html: string, name: string): string {
  // Try name attribute
  const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"));
  if (nameMatch) return nameMatch[1];

  // Try property attribute (for og: tags)
  const propMatch = html.match(new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"));
  if (propMatch) return propMatch[1];

  // Try reversed attribute order
  const revMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i"));
  if (revMatch) return revMatch[1];

  return "";
}

function extractLinkHref(html: string, rel: string): string | null {
  const match = html.match(new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*)["']`, "i"));
  if (match) return match[1];

  const revMatch = html.match(new RegExp(`<link[^>]*href=["']([^"']*)["'][^>]*rel=["']${rel}["']`, "i"));
  if (revMatch) return revMatch[1];

  return null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function extractHeaderNav(html: string): HeaderNavLink[] {
  // Try to find header/nav element
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  if (!headerMatch) return [];

  const navMatch = headerMatch[1].match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  const navHtml = navMatch ? navMatch[1] : headerMatch[1];

  return extractNavLinks(navHtml);
}

function extractNavLinks(navHtml: string): HeaderNavLink[] {
  const links: HeaderNavLink[] = [];

  // Extract top-level links
  const linkMatches = navHtml.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  for (const match of linkMatches) {
    const href = match[1];
    const text = stripTags(match[2]).trim();
    if (text && href && !href.startsWith("#") && !href.startsWith("mailto:")) {
      links.push({ label: text, href });
    }
  }

  return links;
}

function extractFooterNav(html: string): FooterNavLink[] {
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  if (!footerMatch) return [];

  const links: FooterNavLink[] = [];
  const linkMatches = footerMatch[1].matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of linkMatches) {
    const href = match[1];
    const text = stripTags(match[2]).trim();
    if (text && href && !href.startsWith("#") && !href.startsWith("mailto:")) {
      links.push({ label: text, href });
    }
  }

  return links;
}

function extractBreadcrumbs(html: string): BreadcrumbItem[] {
  // Try JSON-LD breadcrumb
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const data = JSON.parse(match.replace(/<\/?script[^>]*>/gi, ""));
        if (data["@type"] === "BreadcrumbList" && Array.isArray(data.itemListElement)) {
          return data.itemListElement.map((item: { name: string; item?: string }) => ({
            label: item.name,
            href: item.item || null,
          }));
        }
      } catch {
        // Skip
      }
    }
  }

  // Try aria-label="breadcrumb" nav
  const breadcrumbNav = html.match(/<nav[^>]*aria-label=["']breadcrumb["'][^>]*>([\s\S]*?)<\/nav>/i);
  if (breadcrumbNav) {
    const links = breadcrumbNav[1].matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
    const items: BreadcrumbItem[] = [];
    for (const link of links) {
      items.push({ label: stripTags(link[2]).trim(), href: link[1] });
    }
    return items;
  }

  // Try ol.breadcrumb / nav.breadcrumb patterns
  const olMatch = html.match(/<ol[^>]*class=["'][^"']*(breadcrumb|breadcrumbs)[^"']*["'][^>]*>([\s\S]*?)<\/ol>/i);
  if (olMatch) {
    const items = olMatch[2].matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
    const breadcrumbs: BreadcrumbItem[] = [];
    for (const item of items) {
      breadcrumbs.push({ label: stripTags(item[2]).trim(), href: item[1] });
    }
    return breadcrumbs;
  }

  return [];
}

function extractMegaMenus(html: string): MegaMenuData[] {
  const megaMenus: MegaMenuData[] = [];

  // Look for common mega menu patterns
  const megaMatch = html.matchAll(/class=["'][^"']*(mega-menu|megamenu|mega_menu|dropdown-menu)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|nav|ul)/gi);

  for (const match of megaMatch) {
    const megaHtml = match[2];
    const links = extractNavLinks(megaHtml);
    if (links.length > 0) {
      megaMenus.push({
        trigger: "nav-item",
        columns: [{ title: "", links: links.map(l => ({ label: l.label, href: l.href })) }],
      });
    }
  }

  return megaMenus;
}

export async function extractPageData(
  url: string
): Promise<PageMetadata> {
  const html = await fetchText(url);
  if (!html) {
    return {
      title: "",
      metaDescription: "",
      canonical: null,
      h1: "",
      jsonLd: null,
      internalLinks: [],
      externalLinks: [],
      images: [],
      headerNavLinks: [],
      footerNavLinks: [],
      breadcrumbs: [],
    };
  }

  const parsed = parseHtml(html);
  return {
    title: parsed.title,
    metaDescription: parsed.metaDescription,
    canonical: parsed.canonical,
    h1: parsed.h1,
    jsonLd: parsed.jsonLd,
    internalLinks: parsed.internalLinks,
    externalLinks: parsed.externalLinks,
    images: parsed.images,
    headerNavLinks: parsed.headerNavLinks,
    footerNavLinks: parsed.footerNavLinks,
    breadcrumbs: parsed.breadcrumbs,
  };
}

export async function fetchPageStatus(url: string): Promise<{ statusCode: number; responseTimeMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "WebsiteFactory-Discovery/1.0" },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    return { statusCode: res.status, responseTimeMs: Date.now() - start };
  } catch {
    return { statusCode: 0, responseTimeMs: Date.now() - start };
  }
}
