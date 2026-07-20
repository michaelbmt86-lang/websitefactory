// ============================================================================
// NETWORK ANALYZER
//
// Analyzes raw HTML for embedded JSON data, API endpoints, lazy-loaded
// content, and hidden product data. Captures XHR/Fetch patterns.
// No site-specific logic.
// ============================================================================

import type { NetworkCapturedData } from "@/types/discovery";

export function analyzeNetworkData(html: string): NetworkCapturedData {
  const xhrRequests = extractAjaxEndpoints(html);
  const fetchRequests = extractFetchPatterns(html);
  const jsonApiResponses = extractEmbeddedJson(html);
  const hiddenData = extractHiddenData(html);
  const lazyLoadedContent = extractLazyLoadedContent(html);

  return { xhrRequests, fetchRequests, jsonApiResponses, hiddenData, lazyLoadedContent };
}

function extractAjaxEndpoints(
  html: string
): { url: string; method: string; status: number | null; responseJson: unknown | null }[] {
  const endpoints: { url: string; method: string; status: number | null; responseJson: unknown | null }[] = [];
  const seen = new Set<string>();

  // Look for API endpoint patterns in scripts
  const apiPatterns = html.matchAll(/(?:fetch|ajax|XMLHttpRequest|\.get|\.post|axios)\s*\(\s*["'`]([^"'`]+)["'`]/gi);
  for (const match of apiPatterns) {
    const url = match[1];
    if (url && !seen.has(url) && !url.startsWith("data:")) {
      endpoints.push({ url, method: "GET", status: null, responseJson: null });
      seen.add(url);
    }
  }

  // WordPress/WooCommerce REST API patterns
  const wpApiPatterns = html.matchAll(/["'`](\/wp-json\/[^"'`]+|\/wp-admin\/admin-ajax\.php[^"'`]*)["'`]/gi);
  for (const match of wpApiPatterns) {
    const url = match[1];
    if (url && !seen.has(url)) {
      endpoints.push({ url, method: "GET", status: null, responseJson: null });
      seen.add(url);
    }
  }

  // Shopify API patterns
  const shopifyPatterns = html.matchAll(/["'`](\/(?:cart|products|collections|search)\.(?:json|js)[^"'`]*)["'`]/gi);
  for (const match of shopifyPatterns) {
    const url = match[1];
    if (url && !seen.has(url)) {
      endpoints.push({ url, method: "GET", status: null, responseJson: null });
      seen.add(url);
    }
  }

  // Generic API patterns
  const genericApi = html.matchAll(/["'`](\/api\/[^"'`]+)["'`]/gi);
  for (const match of genericApi) {
    const url = match[1];
    if (url && !seen.has(url)) {
      endpoints.push({ url, method: "GET", status: null, responseJson: null });
      seen.add(url);
    }
  }

  return endpoints;
}

function extractFetchPatterns(
  html: string
): { url: string; method: string; status: number | null; responseJson: unknown | null }[] {
  const patterns: { url: string; method: string; status: number | null; responseJson: unknown | null }[] = [];
  const seen = new Set<string>();

  // Fetch with method
  const fetchMethod = html.matchAll(/fetch\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*\{[^}]*method\s*:\s*["'`](POST|PUT|GET|DELETE)["'`]/gi);
  for (const match of fetchMethod) {
    const url = match[1];
    if (url && !seen.has(url)) {
      patterns.push({ url, method: match[2].toUpperCase(), status: null, responseJson: null });
      seen.add(url);
    }
  }

  // .json endpoint patterns
  const jsonEndpoints = html.matchAll(/["'`]([^"'`]*\.json(?:\?[^"'`]*)?)["'`]/gi);
  for (const match of jsonEndpoints) {
    const url = match[1];
    if (url && !seen.has(url) && !url.startsWith("data:")) {
      patterns.push({ url, method: "GET", status: null, responseJson: null });
      seen.add(url);
    }
  }

  return patterns;
}

function extractEmbeddedJson(html: string): { url: string; data: unknown }[] {
  const responses: { url: string; data: unknown }[] = [];

  // Look for inline JSON data in script tags (non-LD+JSON)
  const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scriptMatches) {
    const content = match[1].trim();
    if (content.includes("application/ld+json")) continue;

    // Look for product data assignments
    const productData = content.match(/(?:productData|product_data|productConfig|window\.__[A-Z]+)\s*=\s*(\{[\s\S]*?\});/);
    if (productData) {
      try {
        const data = JSON.parse(productData[1]);
        responses.push({ url: "inline:product-data", data });
      } catch { /* skip */ }
    }

    // Look for JSON.parse calls
    const jsonParse = content.matchAll(/JSON\.parse\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g);
    for (const jp of jsonParse) {
      try {
        const data = JSON.parse(jp[1]);
        if (typeof data === "object" && data !== null) {
          responses.push({ url: "inline:json-parse", data });
        }
      } catch { /* skip */ }
    }
  }

  return responses;
}

function extractHiddenData(html: string): unknown[] {
  const hidden: unknown[] = [];

  // Hidden input fields
  const inputs = html.matchAll(/<input[^>]*type=["']hidden["'][^>]*>/gi);
  for (const match of inputs) {
    const nameMatch = match[0].match(/name=["']([^"']+)["']/i);
    const valueMatch = match[0].match(/value=["']([^"']*)["']/i);
    if (nameMatch && valueMatch) {
      hidden.push({ type: "hidden-input", name: nameMatch[1], value: valueMatch[1] });
    }
  }

  // Data attributes on product elements
  const dataAttrs = html.matchAll(/data-(?:product|variant|price|sku|id|inventory)[^=]*=["']([^"']+)["']/gi);
  for (const match of dataAttrs) {
    hidden.push({ type: "data-attribute", value: match[1] });
  }

  // noscript content (often contains product images)
  const noscriptMatches = html.matchAll(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi);
  for (const match of noscriptMatches) {
    hidden.push({ type: "noscript", content: match[1].slice(0, 2000) });
  }

  return hidden;
}

function extractLazyLoadedContent(html: string): unknown[] {
  const lazy: unknown[] = [];

  // Lazy-loaded images
  const lazyImgs = html.matchAll(/<img[^>]*(?:data-src|data-lazy|loading=["']lazy["'])[^>]*>/gi);
  for (const match of lazyImgs) {
    const srcMatch = match[0].match(/(?:data-src|data-lazy-src)=["']([^"']+)["']/i);
    if (srcMatch) {
      lazy.push({ type: "lazy-image", url: srcMatch[1] });
    }
  }

  // Deferred scripts
  const deferredScripts = html.matchAll(/<script[^>]*defer[^>]*src=["']([^"']+)["'][^>]*>/gi);
  for (const match of deferredScripts) {
    lazy.push({ type: "deferred-script", url: match[1] });
  }

  // Intersection Observer targets
  const observerTargets = html.matchAll(/data-(?:observe|intersect|lazy)[^=]*=["']([^"']+)["']/gi);
  for (const match of observerTargets) {
    lazy.push({ type: "observer-target", value: match[1] });
  }

  return lazy;
}
