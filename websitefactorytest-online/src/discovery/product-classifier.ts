// ============================================================================
// PRODUCT CLASSIFIER (Product Discovery Engine)
//
// Classifies products into generic categories based on URL patterns, name,
// and content signals. NOT hardcoded to any specific website.
// ============================================================================

import type { ProductCategory } from "@/types/discovery";

interface ClassificationRule {
  pattern: RegExp;
  category: ProductCategory;
}

// Generic classification rules — works for any ecommerce site
const PRODUCT_CLASSIFICATION_RULES: ClassificationRule[] = [
  // Cups / Drinkware
  { pattern: /\b(cup|mug|tumbler|glass|drinkware|beverag|coffee.?cup|tea.?cup|paper.?cup|cold.?cup|hot.?cup|wine.?glass|beer.?glass|flute|pint|latte|cappuccino)\b/i, category: "Cup" },

  // Lids
  { pattern: /\b(lid|cap|top|cover|seal|stopper|plug)\b/i, category: "Lid" },

  // Containers
  { pattern: /\b(container|box|bowl|tub|tainer|clamshell|tray|plate|dish|pot|jar|vessel|canister|tote|pail)\b/i, category: "Container" },

  // Bags
  { pattern: /\b(bag|sack|pouch|packet|carry.?bag|shopping.?bag|paper.?bag|plastic.?bag|stand.?up.?pouch|ziplock|wrap)\b/i, category: "Bag" },

  // Cutlery
  { pattern: /\b(cutlery|fork|knife|spoon|chopstick|utensil|spork|splayd|stirrer|mixer|stir.?stick)\b/i, category: "Cutlery" },

  // Napkins / Wraps
  { pattern: /\b(napkin|serviette|tissue|wipe|wrap|foil|cling.?wrap|parchment|greaseproof|deli.?paper|wax.?paper)\b/i, category: "Napkin" },

  // Accessories
  { pattern: /\b(accessory|accessories|holder|rack|dispenser|stand|marker|label|sticker|band|tie|clip|ring|sleeve|kraft|biodegrad|compost|eco|sustain|green|bamboo|plant.?base|bagasse|sugarcane|cornstarch|pla|recycl)\b/i, category: "Accessory" },
];

export function classifyProduct(
  url: string,
  productName: string
): ProductCategory {
  // Try URL-based classification first
  const urlLower = url.toLowerCase();
  for (const rule of PRODUCT_CLASSIFICATION_RULES) {
    if (rule.pattern.test(urlLower)) return rule.category;
  }

  // Try product name classification
  const nameLower = (productName || "").toLowerCase();
  for (const rule of PRODUCT_CLASSIFICATION_RULES) {
    if (rule.pattern.test(nameLower)) return rule.category;
  }

  return "Unknown";
}

export function extractProductSlug(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    // The last meaningful segment is usually the product slug
    const lastSegment = segments[segments.length - 1];
    // Remove common suffixes
    return lastSegment
      .replace(/\.(html?|php|aspx?)$/i, "")
      .replace(/[?#].*$/, "");
  } catch {
    return "";
  }
}

export function extractProductName(jsonLd: Record<string, unknown> | null, title: string, h1: string): string {
  // Try JSON-LD first
  if (jsonLd) {
    const name = jsonLd["name"];
    if (typeof name === "string" && name.trim()) return name.trim();
  }

  // Try H1
  if (h1 && h1.trim()) return h1.trim();

  // Try title
  if (title && title.trim()) {
    // Remove common suffixes from titles
    return title
      .replace(/\s*[\|–-]\s*.*$/i, "")
      .replace(/\s*\|\s*.*$/i, "")
      .trim()
      .slice(0, 200);
  }

  return "";
}

export function extractPrice(jsonLd: Record<string, unknown> | null): string | null {
  if (!jsonLd) return null;

  const offers = jsonLd["offers"];
  if (offers && typeof offers === "object") {
    if (Array.isArray(offers)) {
      const first = offers[0] as Record<string, unknown> | undefined;
      if (first) {
        const price = first["price"] ?? first["lowPrice"];
        if (price !== undefined) return String(price);
      }
    } else {
      const offer = offers as Record<string, unknown>;
      const price = offer["price"] ?? offer["lowPrice"];
      if (price !== undefined) return String(price);
    }
  }

  return null;
}

export function extractSku(jsonLd: Record<string, unknown> | null): string | null {
  if (!jsonLd) return null;
  const sku = jsonLd["sku"];
  if (typeof sku === "string") return sku;
  if (Array.isArray(sku) && sku.length > 0) return String(sku[0]);
  return null;
}

export function extractImageUrl(jsonLd: Record<string, unknown> | null): string | null {
  if (!jsonLd) return null;

  const image = jsonLd["image"];
  if (typeof image === "string") return image;
  if (Array.isArray(image) && image.length > 0 && typeof image[0] === "string") return image[0];

  // Check in offers
  const offers = jsonLd["offers"];
  if (offers && typeof offers === "object" && !Array.isArray(offers)) {
    const offerImg = (offers as Record<string, unknown>)["image"];
    if (typeof offerImg === "string") return offerImg;
  }

  return null;
}

export function checkInStock(jsonLd: Record<string, unknown> | null): boolean {
  if (!jsonLd) return true; // Default to in stock

  const offers = jsonLd["offers"];
  if (offers && typeof offers === "object") {
    if (Array.isArray(offers)) {
      return offers.some((o) => {
        if (o && typeof o === "object") {
          const availability = (o as Record<string, unknown>)["availability"];
          return !String(availability).includes("OutOfStock");
        }
        return true;
      });
    }
    const availability = (offers as Record<string, unknown>)["availability"];
    if (typeof availability === "string") {
      return !availability.includes("OutOfStock");
    }
  }

  return true;
}
