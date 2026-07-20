// ============================================================================
// BROWSER METRICS
//
// Defines browser metrics types, metric definitions, aggregation rules, and
// reporting interfaces for the Layer 4 Browser Extraction Layer. This module
// provides type definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Metric Value Types
// ---------------------------------------------------------------------------

export interface MetricSummary {
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  p99Ms?: number;
}

export interface MetricCount {
  total: number;
  avg: number;
  min?: number;
  max?: number;
}

export interface MetricBytes {
  avgBytes: number;
  maxBytes: number;
}

export interface MetricDomSize {
  avgElements: number;
  avgDepth: number;
  avgHtmlSizeBytes: number;
  maxHtmlSizeBytes: number;
}

// ---------------------------------------------------------------------------
// Browser Metrics Definitions
// ---------------------------------------------------------------------------

export type BrowserMetricName =
  | "navigationTime"
  | "domReadyTime"
  | "networkIdleTime"
  | "assetCount"
  | "requestCount"
  | "responseCount"
  | "retryCount"
  | "recoveryCount"
  | "browserLifetime"
  | "memoryUsage"
  | "screenshotCount"
  | "domSize";

export interface BrowserMetricDefinition {
  description: string;
  unit: string;
  aggregation: string[];
  perEngine: boolean;
  perUrl: boolean;
}

export const BROWSER_METRIC_DEFINITIONS: Record<BrowserMetricName, BrowserMetricDefinition> = {
  navigationTime: { description: "Time to navigate to URL", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perEngine: true, perUrl: false },
  domReadyTime: { description: "Time for DOM to be ready after navigation", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perEngine: true, perUrl: false },
  networkIdleTime: { description: "Time until network becomes idle", unit: "ms", aggregation: ["avg", "min", "max", "p95"], perEngine: true, perUrl: false },
  assetCount: { description: "Number of assets discovered on page", unit: "count", aggregation: ["avg", "min", "max"], perEngine: true, perUrl: true },
  requestCount: { description: "Number of HTTP requests made", unit: "count", aggregation: ["avg", "min", "max"], perEngine: true, perUrl: false },
  responseCount: { description: "Number of HTTP responses received", unit: "count", aggregation: ["avg", "min", "max"], perEngine: true, perUrl: false },
  retryCount: { description: "Number of retries per extraction", unit: "count", aggregation: ["avg", "total"], perEngine: true, perUrl: false },
  recoveryCount: { description: "Number of recovery events per extraction", unit: "count", aggregation: ["avg", "total"], perEngine: true, perUrl: false },
  browserLifetime: { description: "Total browser session lifetime", unit: "ms", aggregation: ["avg", "min", "max"], perEngine: true, perUrl: false },
  memoryUsage: { description: "Browser memory usage", unit: "bytes", aggregation: ["avg", "max"], perEngine: true, perUrl: false },
  screenshotCount: { description: "Number of screenshots taken", unit: "count", aggregation: ["total", "avg"], perEngine: true, perUrl: false },
  domSize: { description: "DOM size in elements and bytes", unit: "mixed", aggregation: ["avg", "max"], perEngine: true, perUrl: true },
};

// ---------------------------------------------------------------------------
// Per-Engine Browser Metrics
// ---------------------------------------------------------------------------

export interface EngineBrowserMetrics {
  navigationTime: MetricSummary;
  domReadyTime: MetricSummary;
  networkIdleTime: MetricSummary;
  assetCount: MetricCount;
  requestCount: MetricCount;
  responseCount: MetricCount;
  retryCount: MetricCount;
  recoveryCount: MetricCount;
  browserLifetime: MetricSummary;
  memoryUsage: MetricBytes;
  screenshotCount: MetricCount;
  domSize: MetricDomSize;
}

// ---------------------------------------------------------------------------
// Metrics Aggregation Windows
// ---------------------------------------------------------------------------

export type MetricsWindow = "last10" | "last50" | "last100" | "overall";

export interface MetricsAggregationConfig {
  windows: MetricsWindow[];
  recalculateOnWrite: boolean;
}

export const DEFAULT_METRICS_AGGREGATION: MetricsAggregationConfig = {
  windows: ["last10", "last50", "last100", "overall"],
  recalculateOnWrite: true,
};

// ---------------------------------------------------------------------------
// Metrics Retention
// ---------------------------------------------------------------------------

export interface MetricsRetentionConfig {
  maxRecordsPerEngine: number;
  maxRecordsOverall: number;
  retentionDays: number;
  compressOldRecords: boolean;
  archiveAfterDays: number;
}

export const DEFAULT_METRICS_RETENTION: MetricsRetentionConfig = {
  maxRecordsPerEngine: 1000,
  maxRecordsOverall: 5000,
  retentionDays: 30,
  compressOldRecords: true,
  archiveAfterDays: 7,
};

// ---------------------------------------------------------------------------
// Metrics Reporting
// ---------------------------------------------------------------------------

export interface MetricsReportingConfig {
  reportToLayer3: boolean;
  reportFormat: "json";
  includeTimestamps: boolean;
  includeEngineBreakdown: boolean;
  includeOverallSummary: boolean;
}

export const DEFAULT_METRICS_REPORTING: MetricsReportingConfig = {
  reportToLayer3: true,
  reportFormat: "json",
  includeTimestamps: true,
  includeEngineBreakdown: true,
  includeOverallSummary: true,
};
