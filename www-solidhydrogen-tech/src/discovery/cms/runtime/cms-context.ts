// ============================================================================
// CMS CONTEXT
//
// Defines CMS generation context types and interfaces for the Layer 7
// CMS Generation Layer. This module provides type definitions for generation
// execution context, phase context, and session context only.
// ============================================================================

import type { CmsHealthState } from "./cms-health";
import type { CmsGenerationState } from "./cms-status";

// ---------------------------------------------------------------------------
// CMS Phase Context
// ---------------------------------------------------------------------------

export interface CmsPhaseContext {
  name: string;
  displayName: string;
  priority: number;
  role: "ingestion" | "generation" | "indexing" | "packaging" | "validation";
  timeoutMs: number;
  retryLimit: number;
  healthState: CmsHealthState;
  capabilities: string[];
  limitations: string[];
  tablesRead: string[];
  tablesWrite: string[];
}

// ---------------------------------------------------------------------------
// CMS Generation Context
// ---------------------------------------------------------------------------

export interface CmsGenerationContext {
  siteUrl: string;
  startTime: string;
  currentPhase: string;
  phasesCompleted: number;
  totalPhases: number;
  moduleContexts: CmsPhaseContext[];
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
}

// ---------------------------------------------------------------------------
// CMS Session Context
// ---------------------------------------------------------------------------

export interface CmsSessionContext {
  id: string;
  siteUrl: string;
  state: CmsGenerationState;
  currentStep: string;
  startTime: string;
  lastActivity: string;
  phases: string[];
  retryCount: number;
}

// ---------------------------------------------------------------------------
// CMS Configuration
// ---------------------------------------------------------------------------

export interface CmsConfiguration {
  maxRetries: number;
  retryDelayMs: number;
  phaseTimeoutMs: number;
  totalTimeoutMs: number;
  outputPath: string;
  enableQualityValidation: boolean;
  enableOutputFiles: boolean;
  enableSearchIndex: boolean;
  enableSitemap: boolean;
}

export const DEFAULT_CMS_CONFIGURATION: CmsConfiguration = {
  maxRetries: 0,
  retryDelayMs: 0,
  phaseTimeoutMs: 30000,
  totalTimeoutMs: 300000,
  outputPath: "docs/discovery",
  enableQualityValidation: true,
  enableOutputFiles: true,
  enableSearchIndex: true,
  enableSitemap: true,
};

// ---------------------------------------------------------------------------
// Phase Context Definitions
// ---------------------------------------------------------------------------

export const CMS_PHASE_CONTEXTS: Record<string, CmsPhaseContext> = {
  pages: {
    name: "pages",
    displayName: "CMS Page Generation",
    priority: 1,
    role: "generation",
    timeoutMs: 30000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["page-type-mapping", "seo-metadata", "product-pages", "blog-pages"],
    limitations: ["full-rebuild-only"],
    tablesRead: ["site_urls", "extracted_products"],
    tablesWrite: ["cms_pages"],
  },
  brands: {
    name: "brands",
    displayName: "Brand Generation",
    priority: 2,
    role: "generation",
    timeoutMs: 15000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["brand-extraction", "product-counting", "description-generation"],
    limitations: ["full-rebuild-only"],
    tablesRead: ["extracted_products"],
    tablesWrite: ["cms_brands"],
  },
  collections: {
    name: "collections",
    displayName: "Collection Generation",
    priority: 3,
    role: "generation",
    timeoutMs: 15000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["category-grouping", "product-referencing", "all-products-collection"],
    limitations: ["full-rebuild-only"],
    tablesRead: ["extracted_products"],
    tablesWrite: ["cms_collections"],
  },
  blog: {
    name: "blog",
    displayName: "Blog Post Generation",
    priority: 4,
    role: "generation",
    timeoutMs: 15000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["post-conversion", "blog-metadata", "source-tracking"],
    limitations: ["depends-on-posts-table"],
    tablesRead: ["posts", "cms_pages"],
    tablesWrite: ["cms_pages"],
  },
  seo: {
    name: "seo",
    displayName: "SEO Metadata Generation",
    priority: 5,
    role: "generation",
    timeoutMs: 15000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["meta-tags", "og-tags", "canonical-urls", "schema-json"],
    limitations: ["full-rebuild-only"],
    tablesRead: ["cms_pages"],
    tablesWrite: ["cms_seo"],
  },
  "search-index": {
    name: "search-index",
    displayName: "Search Index Generation",
    priority: 6,
    role: "indexing",
    timeoutMs: 15000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["full-text-index", "keyword-extraction", "multi-entity-search"],
    limitations: ["full-rebuild-only"],
    tablesRead: ["cms_pages", "extracted_products", "cms_brands", "cms_collections"],
    tablesWrite: ["cms_search_index"],
  },
  "output-files": {
    name: "output-files",
    displayName: "Output File Generation",
    priority: 7,
    role: "packaging",
    timeoutMs: 15000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["manifest", "search-output", "navigation", "sitemap"],
    limitations: ["depends-on-all-tables"],
    tablesRead: ["cms_pages", "cms_brands", "cms_collections", "cms_seo", "cms_search_index"],
    tablesWrite: [],
  },
  "quality-validation": {
    name: "quality-validation",
    displayName: "Quality Validation",
    priority: 8,
    role: "validation",
    timeoutMs: 15000,
    retryLimit: 0,
    healthState: "unknown",
    capabilities: ["metadata-check", "seo-check", "link-check", "duplicate-check", "description-check"],
    limitations: ["post-generation-only"],
    tablesRead: ["cms_pages", "cms_brands", "cms_collections", "cms_seo"],
    tablesWrite: [],
  },
};
