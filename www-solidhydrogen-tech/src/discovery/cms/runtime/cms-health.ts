// ============================================================================
// CMS HEALTH
//
// Defines CMS generation health types, health states, health scoring, and
// health monitoring interfaces for the Layer 7 CMS Generation Layer. This
// module provides type definitions and runtime structures only — no execution
// logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Health States
// ---------------------------------------------------------------------------

export type CmsHealthState =
  | "healthy"
  | "warning"
  | "busy"
  | "recovering"
  | "failed"
  | "offline"
  | "recovery-complete"
  | "unknown";

// ---------------------------------------------------------------------------
// Health Score Weights
// ---------------------------------------------------------------------------

export interface CmsHealthScoreWeights {
  successRate: number;
  avgDuration: number;
  errorRate: number;
  consecutiveFailures: number;
}

// ---------------------------------------------------------------------------
// Health Thresholds
// ---------------------------------------------------------------------------

export interface CmsHealthThresholds {
  minSuccessRate: number;
  maxAvgDurationMs: number;
  maxConsecutiveFailures: number;
  maxErrorRate: number;
}

const UNREACHABLE = 999999999;

// ---------------------------------------------------------------------------
// Health State Definitions
// ---------------------------------------------------------------------------

export const CMS_HEALTH_STATE_DEFINITIONS: Record<CmsHealthState, CmsHealthThresholds> = {
  healthy: { minSuccessRate: 0.9, maxAvgDurationMs: 30000, maxConsecutiveFailures: 2, maxErrorRate: 0.1 },
  warning: { minSuccessRate: 0.7, maxAvgDurationMs: 60000, maxConsecutiveFailures: 5, maxErrorRate: 0.3 },
  busy: { minSuccessRate: 0.5, maxAvgDurationMs: 120000, maxConsecutiveFailures: 10, maxErrorRate: 0.5 },
  recovering: { minSuccessRate: 0.0, maxAvgDurationMs: 300000, maxConsecutiveFailures: 15, maxErrorRate: 1.0 },
  failed: { minSuccessRate: 0.0, maxAvgDurationMs: UNREACHABLE, maxConsecutiveFailures: UNREACHABLE, maxErrorRate: 1.0 },
  offline: { minSuccessRate: 0.0, maxAvgDurationMs: UNREACHABLE, maxConsecutiveFailures: UNREACHABLE, maxErrorRate: 1.0 },
  "recovery-complete": { minSuccessRate: 0.8, maxAvgDurationMs: 30000, maxConsecutiveFailures: 0, maxErrorRate: 0.2 },
  unknown: { minSuccessRate: 0.0, maxAvgDurationMs: UNREACHABLE, maxConsecutiveFailures: UNREACHABLE, maxErrorRate: 1.0 },
};

// ---------------------------------------------------------------------------
// Health Score Weights (Default)
// ---------------------------------------------------------------------------

export const DEFAULT_CMS_HEALTH_SCORE_WEIGHTS: CmsHealthScoreWeights = {
  successRate: 0.4,
  avgDuration: 0.2,
  errorRate: 0.2,
  consecutiveFailures: 0.2,
};

// ---------------------------------------------------------------------------
// Health Score Thresholds
// ---------------------------------------------------------------------------

export interface CmsHealthScoreThresholds {
  healthy: number;
  warning: number;
  failed: number;
}

export const DEFAULT_CMS_HEALTH_SCORE_THRESHOLDS: CmsHealthScoreThresholds = {
  healthy: 80,
  warning: 50,
  failed: 20,
};

// ---------------------------------------------------------------------------
// Health Trend
// ---------------------------------------------------------------------------

export type CmsHealthTrendDirection = "improving" | "stable" | "degrading";

export interface CmsHealthTrend {
  direction: CmsHealthTrendDirection;
  changePercent: number;
  windowSize: number;
}

// ---------------------------------------------------------------------------
// CMS Health Metrics
// ---------------------------------------------------------------------------

export interface CmsHealthMetrics {
  successRate: number | null;
  failureRate: number | null;
  avgGenerationDurationMs: number | null;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  timeoutCount: number;
  partialGenerationCount: number;
  qualityCheckFailures: number;
  outputFileFailures: number;
}

// ---------------------------------------------------------------------------
// CMS Quality Metrics
// ---------------------------------------------------------------------------

export interface CmsQualityMetrics {
  seoCoverage: number | null;
  metadataCompleteness: number | null;
  linkIntegrity: number | null;
  duplicateSlugCount: number;
  brokenLinkCount: number;
  missingMetadataCount: number;
  totalIssues: number;
}

// ---------------------------------------------------------------------------
// CMS Health Status
// ---------------------------------------------------------------------------

export interface CmsHealthStatus {
  healthState: CmsHealthState;
  healthScore: number | null;
  metrics: CmsHealthMetrics;
  quality: CmsQualityMetrics;
  trend: CmsHealthTrend;
  lastHealthCheck: string | null;
  nextHealthCheck: string | null;
}

// ---------------------------------------------------------------------------
// Health Check Configuration
// ---------------------------------------------------------------------------

export interface CmsHealthCheckConfig {
  intervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  checkOnGeneration: boolean;
  checkOnFailure: boolean;
  checkOnQuality: boolean;
}

export const DEFAULT_CMS_HEALTH_CHECK_CONFIG: CmsHealthCheckConfig = {
  intervalMs: 300000,
  minIntervalMs: 60000,
  maxIntervalMs: 600000,
  checkOnGeneration: true,
  checkOnFailure: true,
  checkOnQuality: true,
};
