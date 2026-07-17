// ============================================================================
// DOM EXTRACTOR
//
// Extracts structured product data from raw HTML. Parses title, description,
// media, specifications, breadcrumbs, FAQ, reviews, tabs, accordions, and
// structured data. Reusable — no site-specific logic.
// ============================================================================

import type {
  ProductImage,
  ProductVideo,
  ProductDownload,
  ProductSpecification,
  ProductSEO,
  ProductFAQ,
  ProductSchema,
  ProductPageStructure,
  BreadcrumbItem,
} from "@/types/discovery";

export function extractTitle(html: string): string {
  const ogTitle = matchMeta(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitle) return ogTitle;

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag) return decodeEntities(titleTag[1].trim());

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]).trim();

  return "";
}

export function extractSubtitle(html: string): string {
  const ogDesc = matchMeta(html, /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDesc) return decodeEntities(ogDesc);

  const metaDesc = matchMeta(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDesc) return decodeEntities(metaDesc);

  const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2) return stripTags(h2[1]).trim();

  return "";
}

export function extractDescription(html: string): string {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) return stripTags(articleMatch[1]).trim().slice(0, 5000);

  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) return stripTags(mainMatch[1]).trim().slice(0, 5000);

  const contentDiv = html.match(/<div[^>]*class=["'][^"']*(?:product-description|description|content-body|product-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (contentDiv) return stripTags(contentDiv[1]).trim().slice(0, 5000);

  return "";
}

export function extractShortDescription(html: string): string {
  const metaDesc = matchMeta(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDesc) return decodeEntities(metaDesc);

  const summaryMatch = html.match(/<p[^>]*class=["'][^"']*(?:subtitle|summary|lead|short-desc)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  if (summaryMatch) return stripTags(summaryMatch[1]).trim();

  return "";
}

export function extractImages(html: string, baseUrl: string): ProductImage[] {
  const images: ProductImage[] = [];
  const seen = new Set<string>();

  // OG image
  const ogImage = matchMeta(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImage) {
    const url = resolveUrl(ogImage, baseUrl);
    if (url && !seen.has(url)) {
      images.push({ url, alt: "", width: null, height: null, isPrimary: true, isThumbnail: false });
      seen.add(url);
    }
  }

  // Product images from structured selectors
  const imgPatterns = [
    /<img[^>]*class=["'][^"']*(?:product-image|product-photo|product-img|gallery-image|main-image|hero-image)[^"']*["'][^>]*>/gi,
    /<img[^>]*(?:data-src|src)=["']([^"']+)["'][^>]*class=["'][^"']*(?:product|gallery|main|hero)[^"']*["']/gi,
    /<img[^>]*class=["'][^"']*(?:product|gallery|main|hero)[^"']*["'][^>]*(?:data-src|src)=["']([^"']+)["']/gi,
  ];

  for (const pattern of imgPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const imgTag = match[0];
      const src = extractImgSrc(imgTag, baseUrl);
      const alt = extractImgAlt(imgTag);
      if (src && !seen.has(src)) {
        const { width, height } = extractImgDimensions(imgTag);
        images.push({ url: src, alt, width, height, isPrimary: images.length === 0, isThumbnail: false });
        seen.add(src);
      }
    }
  }

  // Gallery images from <a> tags wrapping images
  const galleryLinks = html.matchAll(/<a[^>]*href=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["'][^>]*>/gi);
  for (const match of galleryLinks) {
    const url = resolveUrl(match[1], baseUrl);
    if (url && !seen.has(url)) {
      images.push({ url, alt: "", width: null, height: null, isPrimary: false, isThumbnail: false });
      seen.add(url);
    }
  }

  // All <img> tags in the page as fallback
  if (images.length === 0) {
    const allImgs = html.matchAll(/<img[^>]*(?:data-src|src)=["']([^"']+)["'][^>]*>/gi);
    for (const match of allImgs) {
      const src = resolveUrl(match[1], baseUrl);
      const alt = extractImgAlt(match[0]);
      if (src && !seen.has(src) && !isIconOrSpacer(match[0], src)) {
        images.push({ url: src, alt, width: null, height: null, isPrimary: images.length === 0, isThumbnail: false });
        seen.add(src);
      }
    }
  }

  return images;
}

export function extractVideos(html: string, baseUrl: string): ProductVideo[] {
  const videos: ProductVideo[] = [];
  const seen = new Set<string>();

  // YouTube embeds
  const ytMatches = html.matchAll(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/gi);
  for (const match of ytMatches) {
    const url = `https://www.youtube.com/embed/${match[1]}`;
    if (!seen.has(url)) {
      videos.push({ url, thumbnailUrl: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`, title: "", duration: null });
      seen.add(url);
    }
  }

  // <video> tags
  const videoTags = html.matchAll(/<video[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi);
  for (const match of videoTags) {
    const url = resolveUrl(match[1], baseUrl);
    if (url && !seen.has(url)) {
      const poster = match[0].match(/poster=["']([^"']+)["']/i);
      videos.push({ url, thumbnailUrl: poster ? resolveUrl(poster[1], baseUrl) : null, title: "", duration: null });
      seen.add(url);
    }
  }

  return videos;
}

export function extractDownloads(html: string, baseUrl: string): ProductDownload[] {
  const downloads: ProductDownload[] = [];
  const seen = new Set<string>();

  const dlPatterns = [
    /<a[^>]*href=["']([^"']+\.pdf)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']+\.doc[x]?)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']+\.xls[x]?)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']+\.zip)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']+\.csv)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*(?:download|spec|data.?sheet|technical|sds|msds|t DS)[^"']*["']/gi,
    /<a[^>]*class=["'][^"']*(?:download|spec|data.?sheet|technical|sds|msds|t DS)[^"']*["'][^>]*href=["']([^"']+)["']/gi,
  ];

  for (const pattern of dlPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const url = resolveUrl(match[1], baseUrl);
      if (url && !seen.has(url)) {
        const title = extractLinkText(match[0]);
        const ext = url.split(".").pop()?.toLowerCase() || "file";
        downloads.push({ url, title, type: ext, size: null });
        seen.add(url);
      }
    }
  }

  return downloads;
}

export function extractSpecifications(html: string): ProductSpecification[] {
  const specs: ProductSpecification[] = [];

  // Table-based specs
  const tablePatterns = [
    /<table[^>]*class=["'][^"']*(?:spec|product-info|attributes|details|data)[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi,
    /<table[^>]*>([\s\S]*?)<\/table>/gi,
  ];

  for (const pattern of tablePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const tableHtml = match[1];
      const rows = tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      let currentGroup = "General";

      for (const row of rows) {
        const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
        if (cells.length >= 2) {
          const name = stripTags(cells[0][1]).trim();
          const value = stripTags(cells[1][1]).trim();
          if (name && value && name.toLowerCase() !== value.toLowerCase()) {
            specs.push({ name, value, group: currentGroup });
          }
        } else if (cells.length === 1) {
          const text = stripTags(cells[0][1]).trim();
          if (text) currentGroup = text;
        }
      }
    }
    if (specs.length > 0) break;
  }

  // Definition list specs
  if (specs.length === 0) {
    const dlMatches = html.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi);
    for (const match of dlMatches) {
      const dts = [...match[1].matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/gi)];
      const dds = [...match[1].matchAll(/<dd[^>]*>([\s\S]*?)<\/dd>/gi)];
      for (let i = 0; i < Math.min(dts.length, dds.length); i++) {
        const name = stripTags(dts[i][1]).trim();
        const value = stripTags(dds[i][1]).trim();
        if (name && value) specs.push({ name, value, group: "General" });
      }
    }
  }

  // Div-based specs (key-value pairs)
  if (specs.length === 0) {
    const divSpecs = html.matchAll(/<div[^>]*class=["'][^"']*(?:spec|attribute|detail|feature)[^"']*["'][^>]*>\s*(?:<[^>]+>)*\s*([^<]+)\s*(?:<\/[^>]+>)*\s*(?:<[^>]+>)*\s*([^<]+)/gi);
    for (const match of divSpecs) {
      const name = match[1].trim();
      const value = match[2].trim();
      if (name && value) specs.push({ name, value, group: "General" });
    }
  }

  return specs;
}

export function extractSEO(html: string): ProductSEO {
  const ogTitle = matchMeta(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogDesc = matchMeta(html, /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogImage = matchMeta(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const ogType = matchMeta(html, /<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i);

  const twitterCard = matchMeta(html, /<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i);
  const twitterTitle = matchMeta(html, /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
  const twitterDesc = matchMeta(html, /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
  const twitterImage = matchMeta(html, /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDesc = matchMeta(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);

  return {
    title: titleTag ? decodeEntities(titleTag[1].trim()) : "",
    metaDescription: metaDesc ? decodeEntities(metaDesc) : "",
    canonical: canonical ? canonical[1] : null,
    ogTitle: ogTitle ? decodeEntities(ogTitle) : null,
    ogDescription: ogDesc ? decodeEntities(ogDesc) : null,
    ogImage: ogImage || null,
    ogType: ogType || null,
    twitterCard: twitterCard || null,
    twitterTitle: twitterTitle ? decodeEntities(twitterTitle) : null,
    twitterDescription: twitterDesc ? decodeEntities(twitterDesc) : null,
    twitterImage: twitterImage || null,
  };
}

export function extractSchema(html: string): ProductSchema[] {
  const schemas: ProductSchema[] = [];
  const seen = new Set<string>();

  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item && typeof item === "object" && item["@type"]) {
          const type = String(item["@type"]);
          const raw = JSON.stringify(item);
          if (!seen.has(raw)) {
            schemas.push({ type, data: item as Record<string, unknown>, rawJsonLd: raw });
            seen.add(raw);
          }
        }
      }
    } catch {
      // Skip malformed JSON-LD
    }
  }

  return schemas;
}

export function extractFAQ(html: string): ProductFAQ[] {
  const faqs: ProductFAQ[] = [];

  // FAQ Schema
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "FAQPage" && Array.isArray(item.mainEntity)) {
          for (const entity of item.mainEntity) {
            if (entity.name && entity.acceptedAnswer?.text) {
              faqs.push({ question: entity.name, answer: stripTags(String(entity.acceptedAnswer.text)) });
            }
          }
        }
      }
    } catch { /* skip */ }
  }

  // HTML-based FAQ patterns
  if (faqs.length === 0) {
    const faqSections = html.matchAll(/<div[^>]*class=["'][^"']*(?:faq|accordion|toggle)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi);
    for (const match of faqSections) {
      const questions = [...match[1].matchAll(/<(?:h[2-4]|dt|button|summary)[^>]*>([\s\S]*?)<\/(?:h[2-4]|dt|button|summary)>/gi)];
      const answers = [...match[1].matchAll(/<(?:p|dd|div)[^>]*class=["'][^"']*(?:answer|content|body|toggle-content)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|dd|div)>/gi)];
      for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
        const q = stripTags(questions[i][1]).trim();
        const a = stripTags(answers[i][1]).trim();
        if (q && a) faqs.push({ question: q, answer: a });
      }
    }
  }

  return faqs;
}

export function extractBreadcrumbs(html: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // JSON-LD BreadcrumbList
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "BreadcrumbList" && Array.isArray(item.itemListElement)) {
          for (const bc of item.itemListElement) {
            breadcrumbs.push({
              label: bc.name || bc.item?.name || "",
              href: bc.item?.id || bc.item || null,
            });
          }
          if (breadcrumbs.length > 0) return breadcrumbs;
        }
      }
    } catch { /* skip */ }
  }

  // HTML breadcrumb patterns
  const bcPatterns = [
    /<nav[^>]*class=["'][^"']*(?:breadcrumb|breadcrumbs)[^"']*["'][^>]*>([\s\S]*?)<\/nav>/gi,
    /<div[^>]*class=["'][^"']*(?:breadcrumb|breadcrumbs)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    /<ol[^>]*class=["'][^"']*(?:breadcrumb|breadcrumbs)[^"']*["'][^>]*>([\s\S]*?)<\/ol>/gi,
  ];

  for (const pattern of bcPatterns) {
    const match = pattern.exec(html);
    if (match) {
      const links = [...match[1].matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
      for (const link of links) {
        breadcrumbs.push({ label: stripTags(link[2]).trim(), href: link[1] });
      }
      if (breadcrumbs.length > 0) break;
    }
  }

  return breadcrumbs;
}

export function extractPageStructure(html: string): ProductPageStructure {
  const breadcrumbs = extractBreadcrumbs(html);

  // Tags
  const tags: string[] = [];
  const tagMatches = html.matchAll(/<a[^>]*href=["'][^"']*(?:\/tags?\/|\/tag\/)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi);
  for (const match of tagMatches) {
    const tag = stripTags(match[1]).trim();
    if (tag) tags.push(tag);
  }

  // Collection
  const collectionMatch = html.match(/<(?:span|a|div)[^>]*class=["'][^"']*(?:collection|line|series)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|a|div)>/i);
  const collection = collectionMatch ? stripTags(collectionMatch[1]).trim() : "";

  // CTAs
  const ctas: { text: string; href: string | null }[] = [];
  const ctaMatches = html.matchAll(/<(?:a|button)[^>]*class=["'][^"']*(?:btn|button|cta|add.?to.?cart|buy.?now)[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|button)>/gi);
  for (const match of ctaMatches) {
    const text = stripTags(match[1]).trim();
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
    if (text) ctas.push({ text, href: hrefMatch ? hrefMatch[1] : null });
  }

  // Accordions
  const accordions: { title: string; content: string }[] = [];
  const accordionMatches = html.matchAll(/<(?:h[2-4]|button|summary)[^>]*class=["'][^"']*(?:accordion|toggle|collapsible|expand)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[2-4]|button|summary)>/gi);
  for (const match of accordionMatches) {
    const title = stripTags(match[1]).trim();
    accordions.push({ title, content: "" });
  }

  // Tabs
  const tabs: { title: string; content: string }[] = [];
  const tabMatches = html.matchAll(/<(?:a|button)[^>]*class=["'][^"']*(?:tab|tab-link|tab-button)[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|button)>/gi);
  for (const match of tabMatches) {
    const title = stripTags(match[1]).trim();
    tabs.push({ title, content: "" });
  }

  // Tables
  const tables: { title: string; rows: { label: string; value: string }[] }[] = [];
  const tableMatches = html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  for (const match of tableMatches) {
    const rows: { label: string; value: string }[] = [];
    const trMatches = match[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const tr of trMatches) {
      const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
      if (cells.length >= 2) {
        rows.push({ label: stripTags(cells[0][1]).trim(), value: stripTags(cells[1][1]).trim() });
      }
    }
    if (rows.length > 0) tables.push({ title: "", rows });
  }

  return {
    breadcrumbs,
    tags,
    collection,
    mainContent: extractDescription(html),
    sidebar: "",
    ctas,
    accordions,
    tabs,
    reviews: [],
    tables,
    lists: [],
    forms: [],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function matchMeta(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match ? decodeEntities(match[1]) : null;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function extractImgSrc(imgTag: string, baseUrl: string): string | null {
  const srcMatch = imgTag.match(/(?:data-src|src)=["']([^"']+)["']/i);
  return srcMatch ? resolveUrl(srcMatch[1], baseUrl) : null;
}

function extractImgAlt(imgTag: string): string {
  const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
  return altMatch ? decodeEntities(altMatch[1]) : "";
}

function extractImgDimensions(imgTag: string): { width: number | null; height: number | null } {
  const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
  const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
  return {
    width: widthMatch ? parseInt(widthMatch[1], 10) : null,
    height: heightMatch ? parseInt(heightMatch[1], 10) : null,
  };
}

function isIconOrSpacer(imgTag: string, src: string): boolean {
  const lowerSrc = src.toLowerCase();
  if (lowerSrc.includes("icon") || lowerSrc.includes("logo") || lowerSrc.includes("spacer") || lowerSrc.includes("pixel")) return true;
  const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
  const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
  if (widthMatch && parseInt(widthMatch[1], 10) < 32) return true;
  if (heightMatch && parseInt(heightMatch[1], 10) < 32) return true;
  return false;
}

function extractLinkText(linkTag: string): string {
  const textMatch = linkTag.match(/>([\s\S]*?)<\/a>/i);
  return textMatch ? stripTags(textMatch[1]).trim() : "Download";
}
