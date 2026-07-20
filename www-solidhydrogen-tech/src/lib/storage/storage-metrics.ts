// ============================================================================
// STORAGE METRICS
//
// Defines storage metrics types, metric definitions, aggregation rules, and
// reporting interfaces for the Layer 6 Data Storage Layer. This module provides
// type definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Metric Value Types
// ---------------------------------------------------------------------------

export interface StorageMetricSummary {
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  p99Ms?: number;
}

export interface StorageMetricCount {
  total: number;
  avg: number;
  min?: number;
  max?: number;
}

// ---------------------------------------------------------------------------
// Storage Metric Names
// ---------------------------------------------------------------------------

export type StorageMetricName =
  | "writeDuration"
  | "readDuration"
  | "transactionDuration"
  | "upsertDuration"
  | "batchDuration"
  | "migrationDuration"
  | "tableSize"
  | "indexSize"
  | "totalRows"
  | "avgRowSize";

export interface StorageMetricDefinition {
  description: string;
  unit: string;
  aggregation: string[];
  perTable: boolean;
}

export const STORAGE_METRIC_DEFINITIONS: Record<StorageMetricName, StorageMetricDefinition> = {
  writeDuration: { description: "Duration of write operations (INSERT/UPDATE/DELETE)", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perTable: true },
  readDuration: { description: "Duration of read operations (SELECT)", unit: "ms", aggregation: ["avg", "min", "max", "p95", "p99"], perTable: true },
  transactionDuration: { description: "Duration of transaction operations", unit: "ms", aggregation: ["avg", "min", "max", "p95"], perTable: false },
  upsertDuration: { description: "Duration of upsert operations", unit: "ms", aggregation: ["avg", "min", "max", "p95"], perTable: true },
  batchDuration: { description: "Duration of batch operations", unit: "ms", aggregation: ["avg", "min", "max", "p95"], perTable: true },
  migrationDuration: { description: "Duration of migration operations", unit: "ms", aggregation: ["avg", "min", "max", "p95"], perTable: false },
  tableSize: { description: "Size of individual table", unit: "bytes", aggregation: ["avg", "min", "max"], perTable: true },
  indexSize: { description: "Size of individual index", unit: "bytes", aggregation: ["avg", "min", "max"], perTable: true },
  totalRows: { description: "Total row count per table", unit: "count", aggregation: ["total", "avg"], perTable: true },
  avgRowSize: { description: "Average row size per table", unit: "bytes", aggregation: ["avg", "min", "max"], perTable: true },
};

// ---------------------------------------------------------------------------
// Per-Table Storage Metrics
// ---------------------------------------------------------------------------

export interface TableStorageMetrics {
  name: string;
  sizeBytes: number;
  rowCount: number;
  indexCount: number;
  avgRowBytes: number;
  writeDuration: StorageMetricSummary;
  readDuration: StorageMetricSummary;
  upsertDuration: StorageMetricSummary;
  batchDuration: StorageMetricSummary;
}

// ---------------------------------------------------------------------------
// Metrics Aggregation Windows
// ---------------------------------------------------------------------------

export type StorageMetricsWindow = "last10" | "last50" | "last100" | "overall";

export interface StorageMetricsAggregationConfig {
  windows: StorageMetricsWindow[];
  recalculateOnWrite: boolean;
}

export const DEFAULT_STORAGE_METRICS_AGGREGATION: StorageMetricsAggregationConfig = {
  windows: ["last10", "last50", "last100", "overall"],
  recalculateOnWrite: true,
};

// ---------------------------------------------------------------------------
// Metrics Retention
// ---------------------------------------------------------------------------

export interface StorageMetricsRetentionConfig {
  maxRecordsPerTable: number;
  maxRecordsOverall: number;
  retentionDays: number;
  compressOldRecords: boolean;
  archiveAfterDays: number;
}

export const DEFAULT_STORAGE_METRICS_RETENTION: StorageMetricsRetentionConfig = {
  maxRecordsPerTable: 1000,
  maxRecordsOverall: 5000,
  retentionDays: 30,
  compressOldRecords: true,
  archiveAfterDays: 7,
};

// ---------------------------------------------------------------------------
// Metrics Reporting
// ---------------------------------------------------------------------------

export interface StorageMetricsReportingConfig {
  reportToLayer3: boolean;
  reportFormat: "json";
  includeTimestamps: boolean;
  includeTableBreakdown: boolean;
  includeOverallSummary: boolean;
}

export const DEFAULT_STORAGE_METRICS_REPORTING: StorageMetricsReportingConfig = {
  reportToLayer3: true,
  reportFormat: "json",
  includeTimestamps: true,
  includeTableBreakdown: true,
  includeOverallSummary: true,
};

// ---------------------------------------------------------------------------
// Storage Metrics Summary
// ---------------------------------------------------------------------------

export interface StorageMetricsSummary {
  database: {
    totalSizeBytes: number;
    pageSizeBytes: number;
    totalPages: number;
    freelistPages: number;
    walSizeBytes: number;
  };
  operations: {
    writeDuration: StorageMetricSummary;
    readDuration: StorageMetricSummary;
    transactionDuration: StorageMetricSummary;
    upsertDuration: StorageMetricSummary;
    batchDuration: StorageMetricSummary;
    migrationDuration: StorageMetricSummary;
  };
  tables: Record<string, TableStorageMetrics>;
  overallMetrics: {
    totalWrites: number;
    totalReads: number;
    totalTransactions: number;
    totalUpserts: number;
    totalBatches: number;
    overallAvgWriteMs: number;
    overallAvgReadMs: number;
    overallAvgTransactionMs: number;
  };
  lastUpdated: string | null;
}
