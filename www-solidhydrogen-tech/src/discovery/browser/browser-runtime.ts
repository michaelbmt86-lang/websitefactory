// ============================================================================
// BROWSER RUNTIME
//
// Defines browser runtime metadata types and structures for the Layer 4
// Browser Extraction Layer. This module provides type definitions and
// runtime structures only — no execution logic.
// ============================================================================

import type { ExtractionEngineName } from "@/types/discovery";
import type { BrowserHealthState } from "./browser-health";
import type { BrowserSessionState } from "./browser-session";

// ---------------------------------------------------------------------------
// Runtime Engine Status
// ---------------------------------------------------------------------------

export interface RuntimeEngineStatus {
  name: ExtractionEngineName;
  displayName: string;
  status: BrowserHealthState | "unknown";
  lastHealthCheck: string | null;
  lastSuccessfulExtraction: string | null;
  lastFailedExtraction: string | null;
  consecutiveFailures: number;
  activeSessions: number;
  totalSessionsToday: number;
  currentSession: string | null;
}

// ---------------------------------------------------------------------------
// Runtime Session State
// ---------------------------------------------------------------------------

export interface RuntimeSessionState {
  state: BrowserSessionState;
  count: number;
}

// ---------------------------------------------------------------------------
// Runtime Session History
// ---------------------------------------------------------------------------

export interface RuntimeSessionRecord {
  id: string;
  engine: ExtractionEngineName;
  status: BrowserSessionState;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  navigations: number;
  captures: number;
  failures: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Navigation Record
// ---------------------------------------------------------------------------

export interface RuntimeNavigationRecord {
  id: string;
  url: string;
  engine: ExtractionEngineName;
  status: "success" | "failed" | "timeout" | "redirected";
  finalUrl: string | null;
  responseCode: number | null;
  durationMs: number;
  sessionId: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Capture Record
// ---------------------------------------------------------------------------

export interface RuntimeCaptureRecord {
  id: string;
  url: string;
  engine: ExtractionEngineName;
  status: "success" | "failed" | "empty" | "invalid";
  contentLength: number;
  title: string | null;
  durationMs: number;
  sessionId: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Failure Record
// ---------------------------------------------------------------------------

export interface RuntimeFailureRecord {
  id: string;
  url: string;
  engine: ExtractionEngineName;
  type: "navigation" | "capture" | "session" | "timeout" | "memory";
  category: "network" | "timeout" | "parsing" | "session" | "unknown";
  error: string;
  recoverable: boolean;
  sessionId: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime History Limits
// ---------------------------------------------------------------------------

export interface RuntimeHistoryLimits {
  maxRecentNavigations: number;
  maxRecentCaptures: number;
  maxRecentSessions: number;
  maxRecentFailures: number;
}

export const DEFAULT_HISTORY_LIMITS: RuntimeHistoryLimits = {
  maxRecentNavigations: 100,
  maxRecentCaptures: 100,
  maxRecentSessions: 50,
  maxRecentFailures: 50,
};
