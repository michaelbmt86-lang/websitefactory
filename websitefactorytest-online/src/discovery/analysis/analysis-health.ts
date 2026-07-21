// ============================================================================
// ANALYSIS HEALTH
//
// Defines analysis health types, health states, health scoring, and health
// monitoring interfaces for the Layer 5 AI Analysis Layer. This module
// provides type definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Health States
// ---------------------------------------------------------------------------

export type AnalysisHealthState =
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

export interface AnalysisHealthScoreWeights {
  successRate: number;
  avgDuration: number;
  errorRate: number;
  consecutiveFailures: number;
}

// ---------------------------------------------------------------------------
// Health Thresholds
// ---------------------------------------------------------------------------

export interface AnalysisHealthThresholds {
  minSuccessRate: number;
  maxAvgDurationMs: number;
  maxConsecutiveFailures: number;
  maxErrorRate: number;
}

const UNREACHABLE = 999999999;

// ---------------------------------------------------------------------------
// Health State Definitions
// ---------------------------------------------------------------------------

export const ANALYSIS_HEALTH_STATE_DEFINITIONS: Record<AnalysisHealthState, AnalysisHealthThresholds> = {
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

export const DEFAULT_ANALYSIS_HEALTH_SCORE_WEIGHTS: AnalysisHealthScoreWeights = {
  successRate: 0.4,
  avgDuration: 0.2,
  errorRate: 0.2,
  consecutiveFailures: 0.2,
};

// ---------------------------------------------------------------------------
// Health Score Thresholds
// ---------------------------------------------------------------------------

export interface AnalysisHealthScoreThresholds {
  healthy: number;
  warning: number;
  failed: number;
}

export const DEFAULT_ANALYSIS_HEALTH_SCORE_THRESHOLDS: AnalysisHealthScoreThresholds = {
  healthy: 80,
  warning: 50,
  failed: 20,
};

// ---------------------------------------------------------------------------
// Health Trend
// ---------------------------------------------------------------------------

export type AnalysisHealthTrendDirection = "improving" | "stable" | "degrading";

export interface AnalysisHealthTrend {
  direction: AnalysisHealthTrendDirection;
  changePercent: number;
  windowSize: number;
}

// ---------------------------------------------------------------------------
// Module Health Metrics
// ---------------------------------------------------------------------------

export interface ModuleHealthMetrics {
  successRate: number | null;
  failureRate: number | null;
  avgDurationMs: number | null;
  p95DurationMs: number | null;
  totalAttempts: number;
  totalSuccesses: number;
  totalFailures: number;
  timeoutCount: number;
  parseErrorCount: number;
  dataErrorCount: number;
  unknownErrorCount: number;
}

// ---------------------------------------------------------------------------
// Module Health Status
// ---------------------------------------------------------------------------

export interface ModuleHealthStatus {
  name: string;
  displayName: string;
  healthState: AnalysisHealthState;
  healthScore: number | null;
  metrics: ModuleHealthMetrics;
  trend: AnalysisHealthTrend;
  lastHealthCheck: string | null;
  nextHealthCheck: string | null;
}

// ---------------------------------------------------------------------------
// Health Check Configuration
// ---------------------------------------------------------------------------

export interface AnalysisHealthCheckConfig {
  intervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  checkOnAnalysis: boolean;
  checkOnFailure: boolean;
  checkOnRecovery: boolean;
}

export const DEFAULT_ANALYSIS_HEALTH_CHECK_CONFIG: AnalysisHealthCheckConfig = {
  intervalMs: 300000,
  minIntervalMs: 60000,
  maxIntervalMs: 600000,
  checkOnAnalysis: true,
  checkOnFailure: true,
  checkOnRecovery: true,
};
