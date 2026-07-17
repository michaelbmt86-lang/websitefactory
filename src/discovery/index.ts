// ============================================================================
// DISCOVERY MODULE (Site Discovery Engine)
//
// Barrel export for the complete site discovery engine.
// ============================================================================

export { DiscoveryEngine, discoverSite } from "./discovery-engine";
export { discoverSitemaps, crawlSitemaps, fetchText, parseRobotsTxt, parseSitemapXml } from "./sitemap-parser";
export { extractPageData, fetchPageStatus } from "./page-extractor";
export { classifyUrlByPath, classifyByContent, normalizeUrl, extractSlug, isInternalUrl } from "./page-classifier";
export { buildUrlGraph, getNodeDepth, getChildren, getParent, getSiblings, getNodesByType, getNodesByStatus, getNodesByDepth, getPath } from "./url-graph";
export { generateSiteMapJson, generateUrlGraphJson, generateCrawlSummary, generateDeliveryReport } from "./output-generator";
