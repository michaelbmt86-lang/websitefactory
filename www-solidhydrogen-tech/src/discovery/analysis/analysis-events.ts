// ============================================================================
// ANALYSIS EVENTS
//
// Defines analysis event types and interfaces for the Layer 5 AI
// Analysis Layer. This module provides type definitions for normalization
// events, extraction events, generation events, health events, and error
// events only.
// ============================================================================

import type { AnalysisHealthState } from "./analysis-health";

// ---------------------------------------------------------------------------
// Analysis Event Types
// ---------------------------------------------------------------------------

export type AnalysisEventType =
  | "analysis-started"
  | "analysis-completed"
  | "analysis-failed"
  | "analysis-timeout"
  | "normalization-started"
  | "normalization-completed"
  | "normalization-failed"
  | "extraction-started"
  | "extraction-completed"
  | "extraction-failed"
  | "gemini-started"
  | "gemini-completed"
  | "gemini-failed"
  | "gemini-fallback"
  | "generation-started"
  | "generation-completed"
  | "generation-failed"
  | "seo-generation-completed"
  | "cms-generation-completed"
  | "validation-started"
  | "validation-completed"
  | "validation-failed"
  | "health-check"
  | "health-state-changed"
  | "health-degraded"
  | "health-recovered"
  | "retry-attempted"
  | "retry-succeeded"
  | "retry-failed"
  | "metrics-recorded"
  | "error-occurred";

// ---------------------------------------------------------------------------
// Analysis Event
// ---------------------------------------------------------------------------

export interface AnalysisEvent {
  id: string;
  type: AnalysisEventType;
  module: string;
  sessionId: string;
  url?: string;
  timestamp: string;
  data: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
}

// ---------------------------------------------------------------------------
// Normalization Events
// ---------------------------------------------------------------------------

export interface NormalizationStartedEvent extends AnalysisEvent {
  type: "normalization-started";
  data: {
    url: string;
    htmlSizeBytes: number;
  };
}

export interface NormalizationCompletedEvent extends AnalysisEvent {
  type: "normalization-completed";
  data: {
    url: string;
    inputSizeBytes: number;
    outputSizeBytes: number;
    reductionPercent: number;
    durationMs: number;
  };
}

export interface NormalizationFailedEvent extends AnalysisEvent {
  type: "normalization-failed";
  data: {
    url: string;
    error: string;
    failureType: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Extraction Events
// ---------------------------------------------------------------------------

export interface ExtractionCompletedEvent extends AnalysisEvent {
  type: "extraction-completed";
  data: {
    url: string;
    fieldsExtracted: number;
    specsExtracted: number;
    faqExtracted: number;
    imagesExtracted: number;
    durationMs: number;
  };
}

export interface ExtractionFailedEvent extends AnalysisEvent {
  type: "extraction-failed";
  data: {
    url: string;
    error: string;
    failureType: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Gemini Events
// ---------------------------------------------------------------------------

export interface GeminiCompletedEvent extends AnalysisEvent {
  type: "gemini-completed";
  data: {
    url: string;
    title: string | null;
    fieldsExtracted: number;
    durationMs: number;
  };
}

export interface GeminiFailedEvent extends AnalysisEvent {
  type: "gemini-failed";
  data: {
    url: string;
    error: string;
    durationMs: number;
  };
}

export interface GeminiFallbackEvent extends AnalysisEvent {
  type: "gemini-fallback";
  data: {
    url: string;
    reason: string;
    fallbackToHeuristic: boolean;
  };
}

// ---------------------------------------------------------------------------
// Generation Events
// ---------------------------------------------------------------------------

export interface GenerationCompletedEvent extends AnalysisEvent {
  type: "generation-completed";
  data: {
    url: string;
    module: string;
    itemsGenerated: number;
    durationMs: number;
  };
}

export interface GenerationFailedEvent extends AnalysisEvent {
  type: "generation-failed";
  data: {
    url: string;
    module: string;
    error: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Health Events
// ---------------------------------------------------------------------------

export interface HealthStateChangedEvent extends AnalysisEvent {
  type: "health-state-changed";
  data: {
    from: AnalysisHealthState;
    to: AnalysisHealthState;
    healthScore: number | null;
    reason: string;
  };
}

export interface HealthDegradedEvent extends AnalysisEvent {
  type: "health-degraded";
  data: {
    previousState: AnalysisHealthState;
    currentState: AnalysisHealthState;
    consecutiveFailures: number;
    successRate: number | null;
  };
}

// ---------------------------------------------------------------------------
// Retry Events
// ---------------------------------------------------------------------------

export interface RetryAttemptedEvent extends AnalysisEvent {
  type: "retry-attempted";
  data: {
    url: string;
    module: string;
    retryCount: number;
    maxRetries: number;
    reason: string;
  };
}

export interface RetrySucceededEvent extends AnalysisEvent {
  type: "retry-succeeded";
  data: {
    url: string;
    module: string;
    retryCount: number;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Error Events
// ---------------------------------------------------------------------------

export interface ErrorOccurredEvent extends AnalysisEvent {
  type: "error-occurred";
  data: {
    error: string;
    errorType: string;
    recoverable: boolean;
    stack?: string;
  };
}

// ---------------------------------------------------------------------------
// Event History Limits
// ---------------------------------------------------------------------------

export interface AnalysisEventHistoryLimits {
  maxEvents: number;
  maxEventsPerModule: number;
  maxEventsPerSession: number;
  retentionMs: number;
}

export const DEFAULT_ANALYSIS_EVENT_HISTORY_LIMITS: AnalysisEventHistoryLimits = {
  maxEvents: 500,
  maxEventsPerModule: 200,
  maxEventsPerSession: 50,
  retentionMs: 86400000,
};
