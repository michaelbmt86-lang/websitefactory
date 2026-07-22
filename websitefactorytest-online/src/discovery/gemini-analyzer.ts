// ============================================================================
// GEMINI ANALYZER (Legacy — now wrapped by RegexAnalyzerAdapter)
//
// Receives structured HTML, network JSON, and DOM data from product pages.
// Normalizes data into clean JSON output. Gemini MUST NOT crawl — it only
// analyzes pre-extracted content.
//
// This module is preserved for backward compatibility. New code should
// import `analyze` from "./analyzer-engine" instead.
// ============================================================================

import type {
  ProductSpecification,
  ProductFAQ,
  ProductRelatedProduct,
  ProductPageStructure,
} from "@/types/discovery";

export interface GeminiInput {
  url: string;
  html: string;
  structuredData: Record<string, unknown>[];
  networkData: { url: string; data: unknown }[];
  existingSpecs: ProductSpecification[];
  existingFAQ: ProductFAQ[];
  existingStructure: ProductPageStructure;
}

export interface GeminiOutput {
  title: string;
  subtitle: string;
  description: string;
  shortDescription: string;
  brand: string;
  model: string;
  sku: string;
  category: string;
  subcategory: string;
  specifications: ProductSpecification[];
  faq: ProductFAQ[];
  relatedProducts: ProductRelatedProduct[];
  tags: string[];
  collection: string;
  breadcrumbs: { label: string; href: string | null }[];
}

// ============================================================================
// ANALYZER — Normalizes raw data into clean structured output
// Uses heuristic analysis, not actual Gemini API call.
// This module can be swapped with a real Gemini API call later.
// ============================================================================

export function analyzeWithGemini(input: GeminiInput): GeminiOutput {
  const { html, structuredData, existingSpecs, existingFAQ, existingStructure } = input;

  // Extract from structured data first (most reliable)
  const productData = findProductInJsonLd(structuredData);

  const title = String(productData?.name || extractTitleFromHtml(html));
  const subtitle = typeof productData?.description === "string" ? productData.description.slice(0, 200) : extractSubtitleFromHtml(html);
  const description = typeof productData?.description === "string" ? productData.description : "";
  const shortDescription = typeof productData?.disambiguatingDescription === "string" ? productData.disambiguatingDescription : description.slice(0, 300);
  const brand = extractBrand(productData, html);
  const model = extractModel(productData, html);
  const sku = String(productData?.sku || extractSkuFromHtml(html));
  const category = extractCategoryFromJsonLd(productData) || extractCategoryFromHtml(html);
  const subcategory = extractSubcategoryFromHtml(html);

  // Normalize specifications
  const specifications = normalizeSpecs(existingSpecs, productData);

  // Normalize FAQ
  const faq = normalizeFAQ(existingFAQ, html);

  // Extract related products
  const relatedProducts = extractRelatedProducts(html, structuredData);

  // Extract tags and collection
  const tags = extractTags(html);
  const collection = extractCollection(html);

  return {
    title,
    subtitle,
    description,
    shortDescription,
    brand,
    model,
    sku,
    category,
    subcategory,
    specifications,
    faq,
    relatedProducts,
    tags,
    collection,
    breadcrumbs: existingStructure.breadcrumbs,
  };
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function findProductInJsonLd(data: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const item of data) {
    if (item["@type"] === "Product" || item["@type"] === "IndividualProduct") {
      return item;
    }
    // Check @graph
    if (Array.isArray(item["@graph"])) {
      for (const g of item["@graph"] as Record<string, unknown>[]) {
        if (g["@type"] === "Product" || g["@type"] === "IndividualProduct") {
          return g;
        }
      }
    }
  }
  return null;
}

function extractTitleFromHtml(html: string): string {
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitle) return ogTitle[1];

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag) return titleTag[1].trim().split("|")[0].split("-")[0].trim();

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, "").trim();

  return "";
}

function extractSubtitleFromHtml(html: string): string {
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDesc) return metaDesc[1];

  const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2) return h2[1].replace(/<[^>]+>/g, "").trim();

  return "";
}

function extractBrand(productData: Record<string, unknown> | null, html: string): string {
  if (productData?.brand) {
    const brand = productData.brand;
    if (typeof brand === "string") return brand;
    if (typeof brand === "object" && brand !== null && "name" in brand) {
      return String((brand as Record<string, unknown>).name || "");
    }
  }

  const brandMeta = html.match(/<meta[^>]*property=["']product:brand["'][^>]*content=["']([^"']+)["']/i);
  if (brandMeta) return brandMeta[1];

  const brandMatch = html.match(/class=["'][^"']*(?:brand|manufacturer)[^"']*["'][^>]*>([\s\S]*?)</i);
  if (brandMatch) return brandMatch[1].replace(/<[^>]+>/g, "").trim();

  return "";
}

function extractModel(productData: Record<string, unknown> | null, html: string): string {
  if (productData?.model) return String(productData.model);

  const modelMeta = html.match(/<meta[^>]*property=["']product:retailer_item_id["'][^>]*content=["']([^"']+)["']/i);
  if (modelMeta) return modelMeta[1];

  return "";
}

function extractSkuFromHtml(html: string): string {
  const skuMeta = html.match(/<meta[^>]*property=["']product:retailer_item_id["'][^>]*content=["']([^"']+)["']/i);
  if (skuMeta) return skuMeta[1];

  const skuMatch = html.match(/class=["'][^"']*(?:sku|product-sku)[^"']*["'][^>]*>([\s\S]*?)</i);
  if (skuMatch) return skuMatch[1].replace(/<[^>]+>/g, "").trim();

  return "";
}

function extractCategoryFromJsonLd(productData: Record<string, unknown> | null): string {
  if (productData?.category) return String(productData.category);
  return "";
}

function extractCategoryFromHtml(html: string): string {
  const catMeta = html.match(/<meta[^>]*property=["']product:category["'][^>]*content=["']([^"']+)["']/i);
  if (catMeta) return catMeta[1];

  const bcLinks = [...html.matchAll(/<a[^>]*href=["'][^"']*["'][^>]*class=["'][^"']*(?:breadcrumb|category)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)];
  if (bcLinks.length > 1) return bcLinks[1][1].replace(/<[^>]+>/g, "").trim();

  return "";
}

function extractSubcategoryFromHtml(html: string): string {
  const bcLinks = [...html.matchAll(/<a[^>]*href=["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const breadcrumbs = html.match(/<nav[^>]*class=["'][^"']*(?:breadcrumb)[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  if (breadcrumbs) {
    const links = [...breadcrumbs[1].matchAll(/<a[^>]*href=["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)];
    if (links.length >= 3) return links[links.length - 2][1].replace(/<[^>]+>/g, "").trim();
  }

  // Subcategory from URL
  if (bcLinks.length >= 3) return bcLinks[2][1].replace(/<[^>]+>/g, "").trim();

  return "";
}

function normalizeSpecs(
  existing: ProductSpecification[],
  productData: Record<string, unknown> | null
): ProductSpecification[] {
  const specs = [...existing];

  // Add from JSON-LD additionalProperty
  if (productData?.additionalProperty && Array.isArray(productData.additionalProperty)) {
    for (const prop of productData.additionalProperty as Record<string, unknown>[]) {
      const name = String(prop.name || "");
      const value = String(prop.value || "");
      if (name && value && !specs.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        specs.push({ name, value, group: "Additional" });
      }
    }
  }

  // Add from JSON-LD hasMerchantReturnPolicy, shippingDetails, etc.
  if (productData?.weight) {
    const weight = productData.weight as Record<string, unknown>;
    specs.push({ name: "Weight", value: `${weight.value || ""} ${weight.unitCode || ""}`, group: "Shipping" });
  }

  if (productData?.depth) {
    const depth = productData.depth as Record<string, unknown>;
    specs.push({ name: "Depth", value: `${depth.value || ""} ${depth.unitCode || ""}`, group: "Dimensions" });
  }

  if (productData?.width) {
    const width = productData.width as Record<string, unknown>;
    specs.push({ name: "Width", value: `${width.value || ""} ${width.unitCode || ""}`, group: "Dimensions" });
  }

  if (productData?.height) {
    const height = productData.height as Record<string, unknown>;
    specs.push({ name: "Height", value: `${height.value || ""} ${height.unitCode || ""}`, group: "Dimensions" });
  }

  return specs;
}

function normalizeFAQ(existing: ProductFAQ[], html: string): ProductFAQ[] {
  const faq = [...existing];

  // Try to extract from aria-expanded sections
  if (faq.length === 0) {
    const ariaSections = html.matchAll(/<div[^>]*class=["'][^"']*(?:faq|question)[^"']*["'][^>]*aria-expanded=["']false["'][^>]*>\s*<[^>]*>([\s\S]*?)<\/[^>]*>\s*<[^>]*class=["'][^"']*(?:answer|response)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]*>/gi);
    for (const match of ariaSections) {
      const q = match[1].replace(/<[^>]+>/g, "").trim();
      const a = match[2].replace(/<[^>]+>/g, "").trim();
      if (q && a && !faq.some(f => f.question === q)) {
        faq.push({ question: q, answer: a });
      }
    }
  }

  return faq;
}

function extractRelatedProducts(html: string, structuredData: Record<string, unknown>[]): ProductRelatedProduct[] {
  const related: ProductRelatedProduct[] = [];
  const seen = new Set<string>();

  // From JSON-LD
  for (const data of structuredData) {
    if (data["alsoLike"] && Array.isArray(data["alsoLike"])) {
      for (const item of data["alsoLike"] as Record<string, unknown>[]) {
        if (item.url && typeof item.url === "string" && !seen.has(item.url)) {
          related.push({
            url: item.url,
            name: String(item.name || ""),
            imageUrl: typeof item.image === "string" ? item.image : null,
            price: null,
            relationship: "related",
          });
          seen.add(item.url);
        }
      }
    }
  }

  // From HTML "Related Products" / "You may also like" sections
  const relatedSection = html.match(/<(?:h[2-4]|div|section)[^>]*class=["'][^"']*(?:related|you.?may|cross.?sell|upsell)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[2-4]|div|section)>/i);
  if (relatedSection) {
    const links = relatedSection[1].matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
    for (const link of links) {
      if (!seen.has(link[1]) && link[1] !== "#") {
        const nameMatch = relatedSection[1].match(new RegExp(`href=["']${escapeRegex(link[1])}["'][^>]*>([\\s\\S]*?)<\\/a>`, "i"));
        related.push({
          url: link[1],
          name: nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : "",
          imageUrl: null,
          price: null,
          relationship: "related",
        });
        seen.add(link[1]);
      }
    }
  }

  // Cross-sell / up-sell sections
  const crossSellSection = html.match(/<(?:h[2-4]|div|section)[^>]*class=["'][^"']*(?:cross.?sell|frequently.?bought|complete.?the.?look)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[2-4]|div|section)>/i);
  if (crossSellSection) {
    const links = crossSellSection[1].matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
    for (const link of links) {
      if (!seen.has(link[1]) && link[1] !== "#") {
        related.push({
          url: link[1],
          name: "",
          imageUrl: null,
          price: null,
          relationship: "cross-sell",
        });
        seen.add(link[1]);
      }
    }
  }

  return related;
}

function extractTags(html: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  const tagPatterns = [
    /<a[^>]*href=["'][^"']*(?:\/tags?\/|\/tag\/)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    /<(?:span|a)[^>]*class=["'][^"']*(?:tag|label|badge)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|a)>/gi,
  ];

  for (const pattern of tagPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const tag = match[1].replace(/<[^>]+>/g, "").trim();
      if (tag && !seen.has(tag.toLowerCase())) {
        tags.push(tag);
        seen.add(tag.toLowerCase());
      }
    }
  }

  return tags;
}

function extractCollection(html: string): string {
  const collectionMatch = html.match(/<(?:span|a|div|h[1-6])[^>]*class=["'][^"']*(?:collection|line|series)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|a|div|h[1-6])>/i);
  if (collectionMatch) return collectionMatch[1].replace(/<[^>]+>/g, "").trim();

  const collectionMeta = html.match(/<meta[^>]*property=["']product:category["'][^>]*content=["']([^"']+)["']/i);
  if (collectionMeta) return collectionMeta[1];

  return "";
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
