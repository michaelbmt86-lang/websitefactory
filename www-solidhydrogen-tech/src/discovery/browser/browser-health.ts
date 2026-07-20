// ============================================================================
// BROWSER HEALTH
//
// Defines browser health types, health states, health scoring, and health
// monitoring interfaces for the Layer 4 Browser Extraction Layer. This module
// provides type definitions and runtime structures only — no execution logic.
// ============================================================================

import type { ExtractionEngineName } from "@/types/discovery";

// ---------------------------------------------------------------------------
// Health States
// ---------------------------------------------------------------------------

export type BrowserHealthState =
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

export interface HealthScoreWeights {
  successRate: number;
  avgDuration: number;
  errorRate: number;
  consecutiveFailures: number;
}

// ---------------------------------------------------------------------------
// Health Thresholds
// ---------------------------------------------------------------------------

export interface HealthThresholds {
  minSuccessRate: number;
  maxAvgDurationMs: number;
  maxConsecutiveFailures: number;
  maxErrorRate: number;
}

// ---------------------------------------------------------------------------
// Health State Definitions
// ---------------------------------------------------------------------------

export const HEALTH_STATE_DEFINITIONS: Record<BrowserHealthState, HealthThresholds> = {
  healthy: { minSuccessRate: 0.9, maxAvgDurationMs: 30000, maxConsecutiveFailures: 2, maxErrorRate: 0.1 },
  warning: { minSuccessRate: 0.7, maxAvgDurationMs: 60000, maxConsecutiveFailures: 5, maxErrorRate: 0.3 },
  busy: { minSuccessRate: 0.5, maxAvgDurationMs: 120000, maxConsecutiveFailures: 10, maxErrorRate: 0.5 },
  recovering: { minSuccessRate: 0.0, maxAvgDurationMs: 300000, maxConsecutiveFailures: 15, maxErrorRate: 1.0 },
  failed: { minSuccessRate: 0.0, maxAvgDurationMs: Infinity, maxConsecutiveFailures: Infinity, maxErrorRate: 1.0 },
  offline: { minSuccessRate: 0.0, maxAvgDurationMs: Infinity, maxConsecutiveFailures: Infinity, maxErrorRate: 1.0 },
  "recovery-complete": { minSuccessRate: 0.8, maxAvgDurationMs: 30000, maxConsecutiveFailures: 0, maxErrorRate: 0.2 },
  unknown: { minSuccessRate: 0.0, maxAvgDurationMs: Infinity, maxConsecutiveFailures: Infinity, maxErrorRate: 1.0 },
};

// ---------------------------------------------------------------------------
// Health Score Weights (Default)
// ---------------------------------------------------------------------------

export const DEFAULT_HEALTH_SCORE_WEIGHTS: HealthScoreWeights = {
  successRate: 0.4,
  avgDuration: 0.2,
  errorRate: 0.2,
  consecutiveFailures: 0.2,
};

// ---------------------------------------------------------------------------
// Health Score Thresholds
// ---------------------------------------------------------------------------

export interface HealthScoreThresholds {
  healthy: number;
  warning: number;
  failed: number;
}

export const DEFAULT_HEALTH_SCORE_THRESHOLDS: HealthScoreThresholds = {
  healthy: 80,
  warning: 50,
  failed: 20,
};

// ---------------------------------------------------------------------------
// Health Trend
// ---------------------------------------------------------------------------

export type HealthTrendDirection = "improving" | "stable" | "degrading";

export interface HealthTrend {
  direction: HealthTrendDirection;
  changePercent: number;
  windowSize: number;
}

// ---------------------------------------------------------------------------
// Engine Health Metrics
// ---------------------------------------------------------------------------

export interface EngineHealthMetrics {
  successRate: number | null;
  failureRate: number | null;
  avgDurationMs: number | null;
  p95DurationMs: number | null;
  totalAttempts: number;
  totalSuccesses: number;
  totalFailures: number;
  timeoutCount: number;
  networkErrorCount: number;
  parseErrorCount: number;
  sessionCrashCount: number;
  unknownErrorCount: number;
}

// ---------------------------------------------------------------------------
// Engine Health Status
// ---------------------------------------------------------------------------

export interface EngineHealthStatus {
  name: ExtractionEngineName;
  displayName: string;
  healthState: BrowserHealthState;
  healthScore: number | null;
  metrics: EngineHealthMetrics;
  trend: HealthTrend;
  lastHealthCheck: string | null;
  nextHealthCheck: string | null;
}

// ---------------------------------------------------------------------------
// Health Check Configuration
// ---------------------------------------------------------------------------

export interface HealthCheckConfig {
  intervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  checkOnExtraction: boolean;
  checkOnFailure: boolean;
  checkOnRecovery: boolean;
}

export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  intervalMs: 300000,
  minIntervalMs: 60000,
  maxIntervalMs: 600000,
  checkOnExtraction: true,
  checkOnFailure: true,
  checkOnRecovery: true,
};
