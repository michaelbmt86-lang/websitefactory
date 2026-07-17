// ============================================================================
// DISCOVERY MODULE (Site Discovery Engine)
//
// Barrel export for the complete site + product discovery engine.
// ============================================================================

// Site Discovery
export { DiscoveryEngine, discoverSite } from "./discovery-engine";
export { discoverSitemaps, crawlSitemaps, fetchText, parseRobotsTxt, parseSitemapXml } from "./sitemap-parser";
export { extractPageData, fetchPageStatus } from "./page-extractor";
export { classifyUrlByPath, classifyByContent, normalizeUrl, extractSlug, isInternalUrl } from "./page-classifier";
export { buildUrlGraph, getNodeDepth, getChildren, getParent, getSiblings, getNodesByType, getNodesByStatus, getNodesByDepth, getPath } from "./url-graph";
export { generateSiteMapJson, generateUrlGraphJson, generateCrawlSummary, generateDeliveryReport } from "./output-generator";

// Product Discovery
export { ProductDiscoveryEngine, discoverProducts } from "./product-discovery-engine";
export { classifyProduct, extractProductSlug, extractProductName, extractPrice, extractSku, extractImageUrl, checkInStock } from "./product-classifier";
export { detectPagination, buildPaginationQueue } from "./pagination-handler";
export { generateProductIndexJson, generateCategoryIndexJson, generateProductDiscoverySummary } from "./product-output-generator";
