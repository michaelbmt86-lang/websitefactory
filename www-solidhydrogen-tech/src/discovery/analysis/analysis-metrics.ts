// ============================================================================
// ANALYSIS METRICS
//
// Defines analysis metrics types, metric definitions, aggregation rules, and
// reporting interfaces for the Layer 5 AI Analysis Layer. This module provides
// type definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Metric Value Types
// ---------------------------------------------------------------------------

export interface AnalysisMetricSummary {
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  p99Ms?: number;
}

export interface AnalysisMetricCount {
  total: number;
  avg: number;
  min?: number;
  max?: number;
}

export interface AnalysisMetricBytes {
  avgBytes: number;
  maxBytes: number;
}

// ---------------------------------------------------------------------------
// Analysis Metric Names
// ---------------------------------------------------------------------------

export type AnalysisMetricName =
  | "normalizationTime"
  | "extractionTime"
  | "analysisTime"
  | "generationTime"
  | "validationTime"
  | "inputSize"
  | "outputSize"
  | "fieldsExtracted"
  | "specsExtracted"
  | "faqExtracted"
  | "imagesExtracted"
  | "seoPagesGenerated"
  | "cmsItemsGenerated"
  | "qualityScore"
  | "issuesFound";

export interface AnalysisMetricDefinition {
  description: string;
  unit: string;
  aggregation: string[];
  perModule: boolean;
  perUrl: boolean;
}

export const ANALYSIS_METRIC_DEFINITIONS: Record<AnalysisMetricName, AnalysisMetricDefinition> = {
  normalizationTime: { description: "Time to normalize HTML/CSS/media", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perModule: true, perUrl: false },
  extractionTime: { description: "Time to extract semantic data", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perModule: true, perUrl: false },
  analysisTime: { description: "Time to run Gemini/heuristic analysis", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perModule: true, perUrl: false },
  generationTime: { description: "Time to generate structured output", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perModule: true, perUrl: false },
  validationTime: { description: "Time to validate analysis output", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perModule: true, perUrl: false },
  inputSize: { description: "Input HTML size in bytes", unit: "bytes", aggregation: ["avg", "min", "max"], perModule: false, perUrl: true },
  outputSize: { description: "Output data size in bytes", unit: "bytes", aggregation: ["avg", "min", "max"], perModule: false, perUrl: true },
  fieldsExtracted: { description: "Number of fields extracted", unit: "count", aggregation: ["avg", "min", "max"], perModule: true, perUrl: true },
  specsExtracted: { description: "Number of specifications extracted", unit: "count", aggregation: ["avg", "min", "max"], perModule: true, perUrl: true },
  faqExtracted: { description: "Number of FAQ items extracted", unit: "count", aggregation: ["avg", "min", "max"], perModule: true, perUrl: true },
  imagesExtracted: { description: "Number of images extracted", unit: "count", aggregation: ["avg", "min", "max"], perModule: true, perUrl: true },
  seoPagesGenerated: { description: "Number of SEO pages generated", unit: "count", aggregation: ["total", "avg"], perModule: true, perUrl: false },
  cmsItemsGenerated: { description: "Number of CMS items generated", unit: "count", aggregation: ["total", "avg"], perModule: true, perUrl: false },
  qualityScore: { description: "Quality score (0-1)", unit: "score", aggregation: ["avg", "min", "max"], perModule: false, perUrl: true },
  issuesFound: { description: "Number of issues found", unit: "count", aggregation: ["total", "avg"], perModule: true, perUrl: true },
};

// ---------------------------------------------------------------------------
// Per-Module Analysis Metrics
// ---------------------------------------------------------------------------

export interface ModuleAnalysisMetrics {
  normalizationTime: AnalysisMetricSummary;
  extractionTime: AnalysisMetricSummary;
  analysisTime: AnalysisMetricSummary;
  generationTime: AnalysisMetricSummary;
  validationTime: AnalysisMetricSummary;
  inputSize: AnalysisMetricCount;
  outputSize: AnalysisMetricCount;
  fieldsExtracted: AnalysisMetricCount;
  specsExtracted: AnalysisMetricCount;
  faqExtracted: AnalysisMetricCount;
  imagesExtracted: AnalysisMetricCount;
  seoPagesGenerated: AnalysisMetricCount;
  cmsItemsGenerated: AnalysisMetricCount;
  qualityScore: AnalysisMetricCount;
  issuesFound: AnalysisMetricCount;
}

// ---------------------------------------------------------------------------
// Metrics Aggregation Windows
// ---------------------------------------------------------------------------

export type AnalysisMetricsWindow = "last10" | "last50" | "last100" | "overall";

export interface AnalysisMetricsAggregationConfig {
  windows: AnalysisMetricsWindow[];
  recalculateOnWrite: boolean;
}

export const DEFAULT_ANALYSIS_METRICS_AGGREGATION: AnalysisMetricsAggregationConfig = {
  windows: ["last10", "last50", "last100", "overall"],
  recalculateOnWrite: true,
};

// ---------------------------------------------------------------------------
// Metrics Retention
// ---------------------------------------------------------------------------

export interface AnalysisMetricsRetentionConfig {
  maxRecordsPerModule: number;
  maxRecordsOverall: number;
  retentionDays: number;
  compressOldRecords: boolean;
  archiveAfterDays: number;
}

export const DEFAULT_ANALYSIS_METRICS_RETENTION: AnalysisMetricsRetentionConfig = {
  maxRecordsPerModule: 1000,
  maxRecordsOverall: 5000,
  retentionDays: 30,
  compressOldRecords: true,
  archiveAfterDays: 7,
};

// ---------------------------------------------------------------------------
// Metrics Reporting
// ---------------------------------------------------------------------------

export interface AnalysisMetricsReportingConfig {
  reportToLayer3: boolean;
  reportFormat: "json";
  includeTimestamps: boolean;
  includeModuleBreakdown: boolean;
  includeOverallSummary: boolean;
}

export const DEFAULT_ANALYSIS_METRICS_REPORTING: AnalysisMetricsReportingConfig = {
  reportToLayer3: true,
  reportFormat: "json",
  includeTimestamps: true,
  includeModuleBreakdown: true,
  includeOverallSummary: true,
};
