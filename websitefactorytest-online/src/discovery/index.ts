// ============================================================================
// DISCOVERY MODULE (Site + Product + Detail Extraction + CMS Generator Engines)
//
// Barrel export for the complete discovery engine.
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

// Detail Extraction
export { DetailExtractionEngine, extractProductDetails } from "./detail-extraction-engine";
export { RecoveryExtractionEngine, extractProductDetailsWithRecovery } from "./extraction-with-recovery";
export { extractWithRecovery, getExtractionMetrics, getExtractionMetricsSummary } from "./extraction/extraction-manager";
export { fetchWithJCodesMore } from "./extraction/jcodesmore-engine";
export { fetchWithFirecrawl } from "./extraction/firecrawl-engine";
export { extractTitle, extractSubtitle, extractDescription, extractShortDescription, extractImages, extractDownloads, extractSpecifications, extractSEO, extractSchema, extractFAQ, extractBreadcrumbs, extractPageStructure } from "./dom-extractor";
export { extractAllMedia, getMediaAssetsForProduct, getAllMediaAssets } from "./media-extractor";
export { analyzeNetworkData } from "./network-analyzer";
export { prepareHtmlForExtraction, extractAccordionContent, extractTabContent } from "./dynamic-renderer";
export { analyzeWithGemini } from "./gemini-analyzer";
export { validateExtractionQuality } from "./quality-validator";
export { generateProductsJson, generateMediaLibraryJson, generateSEOLibraryJson, generateSchemaLibraryJson } from "./detail-output-generator";

// CMS Generator
export { generateCms, generateDeploymentManifest } from "./cms/cms-generator-engine";
export { generatePages } from "./cms/page-generator";
export { generateBrands } from "./cms/brand-generator";
export { generateCollections } from "./cms/collection-generator";
export { generateBlogPosts } from "./cms/blog-generator";
export { generateSeoMetadata } from "./cms/seo-generator";
export { generateSearchIndex } from "./cms/search-index-generator";
export { validateCmsQuality } from "./cms/cms-quality-validator";
export { generateCmsManifest, generateCmsSearchOutput, generateCmsNavigation, generateCmsSitemap } from "./cms/cms-output-generator";

// Verification & Delivery
export { runVerification } from "./verification/verification-engine";
export { verifyPages } from "./verification/page-verifier";
export { verifyProducts } from "./verification/product-verifier";
export { verifyMedia } from "./verification/media-verifier";
export { verifyLinks } from "./verification/link-verifier";
export { verifySeo } from "./verification/seo-verifier";
export { verifySchema } from "./verification/schema-verifier";
export { verifyNavigation } from "./verification/navigation-verifier";
export { verifyBuild } from "./verification/build-verifier";
export { verifyDeployment } from "./verification/deployment-verifier";
export { verifySqlite } from "./verification/sqlite-verifier";
export { runAudit } from "./verification/audit-engine";
export { runRepairs } from "./verification/repair-engine";
