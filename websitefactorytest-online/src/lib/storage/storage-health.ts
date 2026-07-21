// ============================================================================
// STORAGE HEALTH
//
// Defines storage health types, health states, health scoring, and health
// monitoring interfaces for the Layer 6 Data Storage Layer. This module
// provides type definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Health States
// ---------------------------------------------------------------------------

export type StorageHealthState =
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

export interface StorageHealthScoreWeights {
  successRate: number;
  avgDuration: number;
  errorRate: number;
  consecutiveFailures: number;
}

// ---------------------------------------------------------------------------
// Health Thresholds
// ---------------------------------------------------------------------------

export interface StorageHealthThresholds {
  minSuccessRate: number;
  maxAvgDurationMs: number;
  maxConsecutiveFailures: number;
  maxErrorRate: number;
}

const UNREACHABLE = 999999999;

// ---------------------------------------------------------------------------
// Health State Definitions
// ---------------------------------------------------------------------------

export const STORAGE_HEALTH_STATE_DEFINITIONS: Record<StorageHealthState, StorageHealthThresholds> = {
  healthy: { minSuccessRate: 0.9, maxAvgDurationMs: 100, maxConsecutiveFailures: 2, maxErrorRate: 0.1 },
  warning: { minSuccessRate: 0.7, maxAvgDurationMs: 500, maxConsecutiveFailures: 5, maxErrorRate: 0.3 },
  busy: { minSuccessRate: 0.5, maxAvgDurationMs: 2000, maxConsecutiveFailures: 10, maxErrorRate: 0.5 },
  recovering: { minSuccessRate: 0.0, maxAvgDurationMs: 10000, maxConsecutiveFailures: 15, maxErrorRate: 1.0 },
  failed: { minSuccessRate: 0.0, maxAvgDurationMs: UNREACHABLE, maxConsecutiveFailures: UNREACHABLE, maxErrorRate: 1.0 },
  offline: { minSuccessRate: 0.0, maxAvgDurationMs: UNREACHABLE, maxConsecutiveFailures: UNREACHABLE, maxErrorRate: 1.0 },
  "recovery-complete": { minSuccessRate: 0.8, maxAvgDurationMs: 100, maxConsecutiveFailures: 0, maxErrorRate: 0.2 },
  unknown: { minSuccessRate: 0.0, maxAvgDurationMs: UNREACHABLE, maxConsecutiveFailures: UNREACHABLE, maxErrorRate: 1.0 },
};

// ---------------------------------------------------------------------------
// Health Score Weights (Default)
// ---------------------------------------------------------------------------

export const DEFAULT_STORAGE_HEALTH_SCORE_WEIGHTS: StorageHealthScoreWeights = {
  successRate: 0.4,
  avgDuration: 0.2,
  errorRate: 0.2,
  consecutiveFailures: 0.2,
};

// ---------------------------------------------------------------------------
// Health Score Thresholds
// ---------------------------------------------------------------------------

export interface StorageHealthScoreThresholds {
  healthy: number;
  warning: number;
  failed: number;
}

export const DEFAULT_STORAGE_HEALTH_SCORE_THRESHOLDS: StorageHealthScoreThresholds = {
  healthy: 80,
  warning: 50,
  failed: 20,
};

// ---------------------------------------------------------------------------
// Health Trend
// ---------------------------------------------------------------------------

export type StorageHealthTrendDirection = "improving" | "stable" | "degrading";

export interface StorageHealthTrend {
  direction: StorageHealthTrendDirection;
  changePercent: number;
  windowSize: number;
}

// ---------------------------------------------------------------------------
// Module Health Metrics
// ---------------------------------------------------------------------------

export interface StorageHealthMetrics {
  successRate: number | null;
  failureRate: number | null;
  avgWriteDurationMs: number | null;
  avgReadDurationMs: number | null;
  totalWrites: number;
  totalReads: number;
  totalFailures: number;
  lockTimeoutCount: number;
  corruptionCount: number;
  diskFullCount: number;
  constraintViolationCount: number;
  foreignkeyViolationCount: number;
  unknownErrorCount: number;
}

// ---------------------------------------------------------------------------
// Storage Health Status
// ---------------------------------------------------------------------------

export interface StorageHealthStatus {
  healthState: StorageHealthState;
  healthScore: number | null;
  metrics: StorageHealthMetrics;
  trend: StorageHealthTrend;
  lastHealthCheck: string | null;
  nextHealthCheck: string | null;
}

// ---------------------------------------------------------------------------
// Pragma Health Status
// ---------------------------------------------------------------------------

export interface PragmaHealthStatus {
  current: string | number;
  expected: string | number;
  status: "healthy" | "warning" | "critical" | "unknown";
}

// ---------------------------------------------------------------------------
// Health Check Configuration
// ---------------------------------------------------------------------------

export interface StorageHealthCheckConfig {
  intervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  checkOnWrite: boolean;
  checkOnFailure: boolean;
  checkOnRecovery: boolean;
}

export const DEFAULT_STORAGE_HEALTH_CHECK_CONFIG: StorageHealthCheckConfig = {
  intervalMs: 300000,
  minIntervalMs: 60000,
  maxIntervalMs: 600000,
  checkOnWrite: true,
  checkOnFailure: true,
  checkOnRecovery: true,
};
