// ============================================================================
// PAGE CLASSIFIER (Site Discovery Engine)
//
// Classifies URLs into page types based on path patterns and content signals.
// Reusable — no site-specific logic.
// ============================================================================

import type { PageType } from "@/types/discovery";

const CLASSIFICATION_RULES: { pattern: RegExp; type: PageType }[] = [
  // Login / Auth
  { pattern: /^\/(login|signin|sign-in|auth|oauth|register|signup|sign-up)(\/|$|\?)/i, type: "Login" },

  // Dashboard / Admin
  { pattern: /^\/(dashboard|admin|panel|cms|manage|backoffice)(\/|$|\?)/i, type: "Dashboard" },

  // Contact
  { pattern: /^\/(contact|contact-us|contactus|get-in-touch|enquiry|enquiries)(\/|$|\?)/i, type: "Contact" },

  // Policy / Legal
  { pattern: /^\/(privacy|privacy-policy|terms|terms-and-conditions|terms-of-service|legal|cookie|cookies|gdpr|refund|shipping|returns|accessibility)(\/|$|\?)/i, type: "Policy" },

  // Blog / News
  { pattern: /^\/(blog|news|articles|journal|stories|press|media|updates|announcements)(\/|$|\?)/i, type: "Blog" },

  // Blog article (blog slug under blog path)
  { pattern: /^\/(blog|news|articles|journal|stories)\/[a-z0-9_-]+(\/|$|\?)/i, type: "Article" },

  // Search
  { pattern: /^\/(search|query|find|results|lookup)(\/|$|\?)/i, type: "Search" },

  // Tag / Category listing
  { pattern: /^\/(tags|tag|labels|topics)(\/|$|\?)/i, type: "Tag" },

  // Author pages
  { pattern: /^\/(author|authors|writers|team|people)(\/|$|\?)/i, type: "Author" },

  // Archives
  { pattern: /^\/(archive|archives|archive-year|archive-month)(\/|$|\?)/i, type: "Archive" },
];

export function classifyUrlByPath(url: string, baseUrl: string): PageType {
  try {
    const parsed = new URL(url, baseUrl);
    const pathname = parsed.pathname;

    // Home
    if (pathname === "/" || pathname === "") return "Home";

    // Check rules
    for (const rule of CLASSIFICATION_RULES) {
      if (rule.pattern.test(pathname)) return rule.type;
    }

    // Default to unknown — further classification done by content analysis
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

export function classifyByContent(url: string, baseUrl: string, metadata: {
  title: string;
  h1: string;
  jsonLd: Record<string, unknown> | null;
}): PageType {
  const pathType = classifyUrlByPath(url, baseUrl);
  if (pathType !== "Unknown") return pathType;

  // JSON-LD type analysis
  if (metadata.jsonLd) {
    const type = metadata.jsonLd["@type"];
    if (typeof type === "string") {
      if (type === "Product") return "Product Detail";
      if (type === "CollectionPage" || type === "ItemList") return "Product Listing";
      if (type === "BlogPosting" || type === "Article" || type === "NewsArticle") return "Article";
      if (type === "Blog") return "Blog";
      if (type === "Organization" || type === "LocalBusiness") return "Landing";
      if (type === "BreadcrumbList") return "Unknown"; // Breadcrumbs don't indicate page type
    }
    if (Array.isArray(type)) {
      if (type.includes("Product")) return "Product Detail";
      if (type.includes("BlogPosting") || type.includes("Article")) return "Article";
    }
  }

  // H1 analysis
  const h1Lower = (metadata.h1 || "").toLowerCase();
  const titleLower = (metadata.title || "").toLowerCase();

  // Category-like patterns in title/h1
  const categoryKeywords = ["category", "collection", "shop all", "browse", "shop by", "product"];
  for (const kw of categoryKeywords) {
    if (titleLower.includes(kw) || h1Lower.includes(kw)) return "Category";
  }

  // Product-like patterns
  const productKeywords = ["product", "buy", "price", "add to cart", "sku", "variant"];
  for (const kw of productKeywords) {
    if (titleLower.includes(kw) || h1Lower.includes(kw)) return "Product Listing";
  }

  // Landing page patterns
  const landingKeywords = ["welcome", "discover", "explore", "start", "learn more", "get started"];
  for (const kw of landingKeywords) {
    if (titleLower.includes(kw) || h1Lower.includes(kw)) return "Landing";
  }

  return "Unknown";
}

export function extractSlug(url: string, baseUrl: string): string {
  try {
    const parsed = new URL(url, baseUrl);
    const pathname = parsed.pathname;
    // Remove leading/trailing slashes and get last segment
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    return segments[segments.length - 1];
  } catch {
    return "";
  }
}

export function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url, baseUrl);
    const base = new URL(baseUrl);
    return parsed.hostname === base.hostname;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const parsed = new URL(url, baseUrl);
    // Remove hash, normalize trailing slash
    let pathname = parsed.pathname;
    if (pathname !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.origin}${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}
