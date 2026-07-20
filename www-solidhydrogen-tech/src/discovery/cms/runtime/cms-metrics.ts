// ============================================================================
// CMS METRICS
//
// Defines CMS generation metrics types, metric definitions, aggregation rules,
// and reporting interfaces for the Layer 7 CMS Generation Layer. This module
// provides type definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Metric Value Types
// ---------------------------------------------------------------------------

export interface CmsMetricSummary {
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  p99Ms?: number;
}

export interface CmsMetricCount {
  total: number;
  avg: number;
  min?: number;
  max?: number;
}

// ---------------------------------------------------------------------------
// CMS Metric Names
// ---------------------------------------------------------------------------

export type CmsMetricName =
  | "generationDuration"
  | "pageGenerationDuration"
  | "brandGenerationDuration"
  | "collectionGenerationDuration"
  | "blogGenerationDuration"
  | "seoGenerationDuration"
  | "searchIndexDuration"
  | "outputFileDuration"
  | "qualityValidationDuration"
  | "pagesGenerated"
  | "brandsGenerated"
  | "collectionsGenerated"
  | "blogPostsGenerated"
  | "seoEntriesGenerated"
  | "searchEntriesGenerated"
  | "seoCoverage"
  | "metadataCompleteness"
  | "linkIntegrity"
  | "searchCoverage";

export interface CmsMetricDefinition {
  description: string;
  unit: string;
  aggregation: string[];
}

export const CMS_METRIC_DEFINITIONS: Record<CmsMetricName, CmsMetricDefinition> = {
  generationDuration: { description: "Total CMS generation duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  pageGenerationDuration: { description: "Page generation phase duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  brandGenerationDuration: { description: "Brand generation phase duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  collectionGenerationDuration: { description: "Collection generation phase duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  blogGenerationDuration: { description: "Blog generation phase duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  seoGenerationDuration: { description: "SEO generation phase duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  searchIndexDuration: { description: "Search index generation duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  outputFileDuration: { description: "Output file generation duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  qualityValidationDuration: { description: "Quality validation duration", unit: "ms", aggregation: ["avg", "min", "max", "p95"] },
  pagesGenerated: { description: "Number of CMS pages generated", unit: "count", aggregation: ["total", "avg", "min", "max"] },
  brandsGenerated: { description: "Number of brands generated", unit: "count", aggregation: ["total", "avg", "min", "max"] },
  collectionsGenerated: { description: "Number of collections generated", unit: "count", aggregation: ["total", "avg", "min", "max"] },
  blogPostsGenerated: { description: "Number of blog posts generated", unit: "count", aggregation: ["total", "avg", "min", "max"] },
  seoEntriesGenerated: { description: "Number of SEO entries generated", unit: "count", aggregation: ["total", "avg", "min", "max"] },
  searchEntriesGenerated: { description: "Number of search entries generated", unit: "count", aggregation: ["total", "avg", "min", "max"] },
  seoCoverage: { description: "SEO coverage percentage", unit: "percent", aggregation: ["avg", "min", "max"] },
  metadataCompleteness: { description: "Metadata completeness percentage", unit: "percent", aggregation: ["avg", "min", "max"] },
  linkIntegrity: { description: "Link integrity percentage", unit: "percent", aggregation: ["avg", "min", "max"] },
  searchCoverage: { description: "Search index coverage percentage", unit: "percent", aggregation: ["avg", "min", "max"] },
};

// ---------------------------------------------------------------------------
// Metrics Aggregation Windows
// ---------------------------------------------------------------------------

export type CmsMetricsWindow = "last5" | "last10" | "last25" | "overall";

export interface CmsMetricsAggregationConfig {
  windows: CmsMetricsWindow[];
  recalculateOnWrite: boolean;
}

export const DEFAULT_CMS_METRICS_AGGREGATION: CmsMetricsAggregationConfig = {
  windows: ["last5", "last10", "last25", "overall"],
  recalculateOnWrite: true,
};

// ---------------------------------------------------------------------------
// Metrics Retention
// ---------------------------------------------------------------------------

export interface CmsMetricsRetentionConfig {
  maxRecordsOverall: number;
  retentionDays: number;
  compressOldRecords: boolean;
  archiveAfterDays: number;
}

export const DEFAULT_CMS_METRICS_RETENTION: CmsMetricsRetentionConfig = {
  maxRecordsOverall: 500,
  retentionDays: 30,
  compressOldRecords: true,
  archiveAfterDays: 7,
};

// ---------------------------------------------------------------------------
// CMS Metrics Summary
// ---------------------------------------------------------------------------

export interface CmsMetricsSummary {
  generation: CmsMetricSummary;
  phases: {
    pages: CmsMetricSummary;
    brands: CmsMetricSummary;
    collections: CmsMetricSummary;
    blog: CmsMetricSummary;
    seo: CmsMetricSummary;
    searchIndex: CmsMetricSummary;
    outputFiles: CmsMetricSummary;
    qualityValidation: CmsMetricSummary;
  };
  records: {
    pagesGenerated: CmsMetricCount;
    brandsGenerated: CmsMetricCount;
    collectionsGenerated: CmsMetricCount;
    blogPostsGenerated: CmsMetricCount;
    seoEntriesGenerated: CmsMetricCount;
    searchEntriesGenerated: CmsMetricCount;
  };
  coverage: {
    seoCoverage: CmsMetricCount;
    metadataCompleteness: CmsMetricCount;
    linkIntegrity: CmsMetricCount;
    searchCoverage: CmsMetricCount;
  };
  lastUpdated: string | null;
}
