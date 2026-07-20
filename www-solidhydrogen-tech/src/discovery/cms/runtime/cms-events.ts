// ============================================================================
// CMS EVENTS
//
// Defines CMS generation event types and interfaces for the Layer 7
// CMS Generation Layer. This module provides type definitions for generation
// events, phase events, quality events, and error events only.
// ============================================================================

import type { CmsHealthState } from "./cms-health";

// ---------------------------------------------------------------------------
// CMS Event Types
// ---------------------------------------------------------------------------

export type CmsEventType =
  | "cms-generation-started"
  | "cms-generation-completed"
  | "cms-generation-failed"
  | "cms-generation-timeout"
  | "cms-phase-started"
  | "cms-phase-completed"
  | "cms-phase-failed"
  | "cms-phase-timeout"
  | "cms-page-generated"
  | "cms-brand-generated"
  | "cms-collection-generated"
  | "cms-blog-generated"
  | "cms-seo-generated"
  | "cms-search-index-generated"
  | "cms-output-generated"
  | "cms-quality-checked"
  | "cms-quality-issue-found"
  | "cms-health-check"
  | "cms-health-state-changed"
  | "cms-health-degraded"
  | "cms-health-recovered"
  | "cms-retry-attempted"
  | "cms-retry-succeeded"
  | "cms-retry-failed"
  | "cms-metrics-recorded"
  | "cms-error-occurred";

// ---------------------------------------------------------------------------
// CMS Event
// ---------------------------------------------------------------------------

export interface CmsEvent {
  id: string;
  type: CmsEventType;
  module: string;
  sessionId: string;
  siteUrl?: string;
  timestamp: string;
  data: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
}

// ---------------------------------------------------------------------------
// Generation Events
// ---------------------------------------------------------------------------

export interface CmsGenerationStartedEvent extends CmsEvent {
  type: "cms-generation-started";
  data: {
    siteUrl: string;
    totalPhases: number;
  };
}

export interface CmsGenerationCompletedEvent extends CmsEvent {
  type: "cms-generation-completed";
  data: {
    siteUrl: string;
    phasesCompleted: number;
    pagesGenerated: number;
    brandsGenerated: number;
    collectionsGenerated: number;
    blogPostsGenerated: number;
    seoEntriesGenerated: number;
    searchEntriesGenerated: number;
    durationMs: number;
  };
}

export interface CmsGenerationFailedEvent extends CmsEvent {
  type: "cms-generation-failed";
  data: {
    siteUrl: string;
    failedPhase: string;
    error: string;
    phasesCompleted: number;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Phase Events
// ---------------------------------------------------------------------------

export interface CmsPhaseStartedEvent extends CmsEvent {
  type: "cms-phase-started";
  data: {
    phase: string;
    siteUrl: string;
  };
}

export interface CmsPhaseCompletedEvent extends CmsEvent {
  type: "cms-phase-completed";
  data: {
    phase: string;
    recordsGenerated: number;
    durationMs: number;
  };
}

export interface CmsPhaseFailedEvent extends CmsEvent {
  type: "cms-phase-failed";
  data: {
    phase: string;
    error: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Quality Events
// ---------------------------------------------------------------------------

export interface CmsQualityCheckedEvent extends CmsEvent {
  type: "cms-quality-checked";
  data: {
    totalChecks: number;
    passedChecks: number;
    warningChecks: number;
    failedChecks: number;
    overallStatus: string;
    durationMs: number;
  };
}

export interface CmsQualityIssueFoundEvent extends CmsEvent {
  type: "cms-quality-issue-found";
  data: {
    issueType: string;
    entityType: string;
    entitySlug: string;
    severity: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Health Events
// ---------------------------------------------------------------------------

export interface CmsHealthStateChangedEvent extends CmsEvent {
  type: "cms-health-state-changed";
  data: {
    from: CmsHealthState;
    to: CmsHealthState;
    healthScore: number | null;
    reason: string;
  };
}

// ---------------------------------------------------------------------------
// Retry Events
// ---------------------------------------------------------------------------

export interface CmsRetryAttemptedEvent extends CmsEvent {
  type: "cms-retry-attempted";
  data: {
    phase: string;
    retryCount: number;
    maxRetries: number;
    reason: string;
  };
}

// ---------------------------------------------------------------------------
// Error Events
// ---------------------------------------------------------------------------

export interface CmsErrorOccurredEvent extends CmsEvent {
  type: "cms-error-occurred";
  data: {
    error: string;
    errorType: string;
    phase: string;
    recoverable: boolean;
    stack?: string;
  };
}

// ---------------------------------------------------------------------------
// Event History Limits
// ---------------------------------------------------------------------------

export interface CmsEventHistoryLimits {
  maxEvents: number;
  maxEventsPerPhase: number;
  maxEventsPerSession: number;
  retentionMs: number;
}

export const DEFAULT_CMS_EVENT_HISTORY_LIMITS: CmsEventHistoryLimits = {
  maxEvents: 500,
  maxEventsPerPhase: 100,
  maxEventsPerSession: 50,
  retentionMs: 86400000,
};
