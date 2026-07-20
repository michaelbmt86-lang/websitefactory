// ============================================================================
// BROWSER EVENTS
//
// Defines browser event types and interfaces for the Layer 4 Browser
// Extraction Layer. This module provides type definitions for session events,
// navigation events, capture events, health events, and recovery events only.
// ============================================================================

import type { ExtractionEngineName } from "@/types/discovery";
import type { BrowserSessionState } from "./browser-session";
import type { BrowserHealthState } from "./browser-health";

// ---------------------------------------------------------------------------
// Browser Event Types
// ---------------------------------------------------------------------------

export type BrowserEventType =
  | "session-created"
  | "session-state-changed"
  | "session-closed"
  | "session-failed"
  | "session-timeout"
  | "session-recovered"
  | "navigation-started"
  | "navigation-completed"
  | "navigation-failed"
  | "navigation-timeout"
  | "capture-started"
  | "capture-completed"
  | "capture-failed"
  | "capture-empty"
  | "health-check"
  | "health-state-changed"
  | "health-degraded"
  | "health-recovered"
  | "recovery-attempted"
  | "recovery-succeeded"
  | "recovery-failed"
  | "metrics-recorded"
  | "error-occurred";

// ---------------------------------------------------------------------------
// Browser Event
// ---------------------------------------------------------------------------

export interface BrowserEvent {
  id: string;
  type: BrowserEventType;
  engine: ExtractionEngineName;
  sessionId: string;
  url?: string;
  timestamp: string;
  data: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
}

// ---------------------------------------------------------------------------
// Session Events
// ---------------------------------------------------------------------------

export interface SessionCreatedEvent extends BrowserEvent {
  type: "session-created";
  data: {
    engine: ExtractionEngineName;
    config: Record<string, unknown>;
  };
}

export interface SessionStateChangedEvent extends BrowserEvent {
  type: "session-state-changed";
  data: {
    from: BrowserSessionState;
    to: BrowserSessionState;
    reason: string;
  };
}

export interface SessionClosedEvent extends BrowserEvent {
  type: "session-closed";
  data: {
    durationMs: number;
    navigations: number;
    captures: number;
    failures: number;
  };
}

export interface SessionFailedEvent extends BrowserEvent {
  type: "session-failed";
  data: {
    error: string;
    failureType: string;
    recoverable: boolean;
  };
}

// ---------------------------------------------------------------------------
// Navigation Events
// ---------------------------------------------------------------------------

export interface NavigationCompletedEvent extends BrowserEvent {
  type: "navigation-completed";
  data: {
    finalUrl: string;
    responseCode: number;
    durationMs: number;
    contentLength: number;
  };
}

export interface NavigationFailedEvent extends BrowserEvent {
  type: "navigation-failed";
  data: {
    error: string;
    failureType: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Capture Events
// ---------------------------------------------------------------------------

export interface CaptureCompletedEvent extends BrowserEvent {
  type: "capture-completed";
  data: {
    contentLength: number;
    title: string | null;
    durationMs: number;
    assetCount: number;
  };
}

export interface CaptureFailedEvent extends BrowserEvent {
  type: "capture-failed";
  data: {
    error: string;
    failureType: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Health Events
// ---------------------------------------------------------------------------

export interface HealthStateChangedEvent extends BrowserEvent {
  type: "health-state-changed";
  data: {
    from: BrowserHealthState;
    to: BrowserHealthState;
    healthScore: number | null;
    reason: string;
  };
}

export interface HealthDegradedEvent extends BrowserEvent {
  type: "health-degraded";
  data: {
    previousState: BrowserHealthState;
    currentState: BrowserHealthState;
    consecutiveFailures: number;
    successRate: number | null;
  };
}

// ---------------------------------------------------------------------------
// Recovery Events
// ---------------------------------------------------------------------------

export interface RecoveryAttemptedEvent extends BrowserEvent {
  type: "recovery-attempted";
  data: {
    failureType: string;
    failureCategory: string;
    recoverable: boolean;
    action: string;
  };
}

export interface RecoverySucceededEvent extends BrowserEvent {
  type: "recovery-succeeded";
  data: {
    newSessionId: string;
    durationMs: number;
  };
}

export interface RecoveryFailedEvent extends BrowserEvent {
  type: "recovery-failed";
  data: {
    error: string;
    reportedToLayer3: boolean;
  };
}

// ---------------------------------------------------------------------------
// Error Events
// ---------------------------------------------------------------------------

export interface ErrorOccurredEvent extends BrowserEvent {
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

export interface BrowserEventHistoryLimits {
  maxEvents: number;
  maxEventsPerEngine: number;
  maxEventsPerSession: number;
  retentionMs: number;
}

export const DEFAULT_EVENT_HISTORY_LIMITS: BrowserEventHistoryLimits = {
  maxEvents: 500,
  maxEventsPerEngine: 200,
  maxEventsPerSession: 50,
  retentionMs: 86400000, // 24 hours
};
