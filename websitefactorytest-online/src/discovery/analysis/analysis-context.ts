// ============================================================================
// ANALYSIS CONTEXT
//
// Defines analysis context types and interfaces for the Layer 5 AI
// Analysis Layer. This module provides type definitions for analysis
// execution context, module context, and analysis session context only.
// ============================================================================

import type { AnalysisHealthState } from "./analysis-health";
import type { AnalysisModuleState } from "./analysis-status";

// ---------------------------------------------------------------------------
// Analysis Module Context
// ---------------------------------------------------------------------------

export interface AnalysisModuleContext {
  name: string;
  displayName: string;
  priority: number;
  role: "normalization" | "extraction" | "analysis" | "generation" | "validation";
  timeoutMs: number;
  retryLimit: number;
  healthState: AnalysisHealthState;
  capabilities: string[];
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Analysis Execution Context
// ---------------------------------------------------------------------------

export interface AnalysisExtractionContext {
  url: string;
  html: string;
  module: string;
  moduleContext: AnalysisModuleContext;
  startTime: string;
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
}

// ---------------------------------------------------------------------------
// Analysis Normalization Context
// ---------------------------------------------------------------------------

export interface AnalysisNormalizationContext {
  url: string;
  rawHtml: string;
  normalizedHtml: string;
  cssData: Record<string, unknown>;
  mediaAssets: Array<{ url: string; type: string; position: number }>;
  normalizedUrls: string[];
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Analysis Extraction Context
// ---------------------------------------------------------------------------

export interface AnalysisExtractionResultContext {
  url: string;
  title: string | null;
  description: string | null;
  specifications: Array<{ name: string; value: string }>;
  faq: Array<{ question: string; answer: string }>;
  breadcrumbs: Array<{ label: string; href: string | null }>;
  images: Array<{ url: string; alt: string; position: number }>;
  downloads: Array<{ url: string; filename: string }>;
  seo: Record<string, unknown>;
  schema: Array<{ type: string; data: Record<string, unknown> }>;
  pageStructure: Record<string, unknown>;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Analysis Gemini Context
// ---------------------------------------------------------------------------

export interface AnalysisGeminiContext {
  url: string;
  html: string;
  structuredData: Record<string, unknown>[];
  networkData: { url: string; data: unknown }[];
  existingSpecs: Array<{ name: string; value: string }>;
  existingFaq: Array<{ question: string; answer: string }>;
  existingStructure: Record<string, unknown>;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Analysis Generation Context
// ---------------------------------------------------------------------------

export interface AnalysisGenerationContext {
  url: string;
  productsJson: Record<string, unknown> | null;
  mediaLibraryJson: Record<string, unknown> | null;
  seoLibraryJson: Record<string, unknown> | null;
  schemaLibraryJson: Record<string, unknown> | null;
  cmsPages: number;
  cmsBrands: number;
  cmsCollections: number;
  cmsBlogPosts: number;
  seoPages: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Analysis Session Context
// ---------------------------------------------------------------------------

export interface AnalysisSessionContext {
  id: string;
  url: string;
  state: AnalysisModuleState;
  currentStep: string;
  startTime: string;
  lastActivity: string;
  modules: string[];
  retryCount: number;
}

// ---------------------------------------------------------------------------
// Module Context Definitions
// ---------------------------------------------------------------------------

export const ANALYSIS_MODULE_CONTEXTS: Record<string, AnalysisModuleContext> = {
  normalization: {
    name: "normalization",
    displayName: "HTML/CSS/Media Normalization",
    priority: 1,
    role: "normalization",
    timeoutMs: 30000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["html-stripping", "entity-decoding", "whitespace-normalization", "css-extraction", "media-deduplication"],
    limitations: ["no-javascript-execution", "regex-based-parsing"],
  },
  "dom-extractor": {
    name: "dom-extractor",
    displayName: "DOM Data Extractor",
    priority: 2,
    role: "extraction",
    timeoutMs: 30000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["title-extraction", "spec-extraction", "faq-extraction", "breadcrumb-extraction", "structure-extraction", "seo-extraction", "schema-extraction"],
    limitations: ["regex-based-parsing", "no-ai-analysis"],
  },
  "regex-analyzer": {
    name: "regex-analyzer",
    displayName: "Regex Analyzer Adapter",
    priority: 3,
    role: "analysis",
    timeoutMs: 60000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["heuristic-normalization", "jsonld-parsing", "brand-extraction", "tag-extraction", "category-classification"],
    limitations: ["heuristic-only", "no-real-ai-api"],
  },
  "seo-generator": {
    name: "seo-generator",
    displayName: "SEO Metadata Generator",
    priority: 4,
    role: "generation",
    timeoutMs: 30000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["meta-tag-generation", "og-tag-generation", "canonical-generation", "schema-generation"],
    limitations: ["no-ai-generation", "template-based"],
  },
  "cms-generator": {
    name: "cms-generator",
    displayName: "CMS Content Generator",
    priority: 5,
    role: "generation",
    timeoutMs: 60000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["page-generation", "brand-generation", "collection-generation", "blog-generation", "search-index"],
    limitations: ["template-based", "no-ai-content-generation"],
  },
  "quality-validator": {
    name: "quality-validator",
    displayName: "Quality Validator",
    priority: 6,
    role: "validation",
    timeoutMs: 30000,
    retryLimit: 1,
    healthState: "unknown",
    capabilities: ["completeness-check", "duplicate-detection", "quality-scoring", "report-generation"],
    limitations: ["post-extraction-only"],
  },
};
