// ============================================================================
// BROWSER STATE
//
// Defines browser state management types and interfaces for the Layer 4
// Browser Extraction Layer. This module provides type definitions for
// session state tracking, navigation state, and capture state only.
// ============================================================================

import type { ExtractionEngineName } from "@/types/discovery";
import type { BrowserSessionState, BrowserSession } from "./browser-session";
import type { BrowserHealthState } from "./browser-health";

// ---------------------------------------------------------------------------
// Navigation State
// ---------------------------------------------------------------------------

export type NavigationState = "pending" | "navigating" | "completed" | "failed" | "timeout";

export interface NavigationStatus {
  url: string;
  state: NavigationState;
  engine: ExtractionEngineName;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  responseCode: number | null;
  finalUrl: string | null;
}

// ---------------------------------------------------------------------------
// Capture State
// ---------------------------------------------------------------------------

export type CaptureState = "pending" | "capturing" | "completed" | "failed" | "empty";

export interface CaptureStatus {
  url: string;
  state: CaptureState;
  engine: ExtractionEngineName;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  contentLength: number;
  title: string | null;
}

// ---------------------------------------------------------------------------
// Browser State Summary
// ---------------------------------------------------------------------------

export interface BrowserStateSummary {
  totalSessions: number;
  activeSessions: number;
  failedSessions: number;
  closedSessions: number;
  totalNavigations: number;
  successfulNavigations: number;
  failedNavigations: number;
  totalCaptures: number;
  successfulCaptures: number;
  failedCaptures: number;
  overallHealth: BrowserHealthState;
  lastActivity: string | null;
}

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const NAVIGATION_STATE_TRANSITIONS: Record<NavigationState, NavigationState[]> = {
  pending: ["navigating", "failed", "timeout"],
  navigating: ["completed", "failed", "timeout"],
  completed: [],
  failed: [],
  timeout: [],
};

export const CAPTURE_STATE_TRANSITIONS: Record<CaptureState, CaptureState[]> = {
  pending: ["capturing", "failed"],
  capturing: ["completed", "failed", "empty"],
  completed: [],
  failed: [],
  empty: [],
};

// ---------------------------------------------------------------------------
// Session State Tracker
// ---------------------------------------------------------------------------

export interface SessionStateTracker {
  session: BrowserSession;
  navigationState: NavigationStatus | null;
  captureState: CaptureStatus | null;
  lastStateChange: string;
  stateChanges: Array<{
    from: BrowserSessionState;
    to: BrowserSessionState;
    timestamp: string;
    reason: string;
  }>;
}
