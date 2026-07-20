// ============================================================================
// BROWSER SESSION
//
// Defines browser session types, lifecycle states, and session management
// interfaces for the Layer 4 Browser Extraction Layer. This module provides
// type definitions and runtime structures only — no execution logic.
// ============================================================================

import type { ExtractionEngineName } from "@/types/discovery";

// ---------------------------------------------------------------------------
// Session States
// ---------------------------------------------------------------------------

export type BrowserSessionState =
  | "created"
  | "active"
  | "busy"
  | "idle"
  | "failed"
  | "closed"
  | "recovered"
  | "timeout";

// ---------------------------------------------------------------------------
// Session Configuration
// ---------------------------------------------------------------------------

export interface BrowserSessionConfig {
  timeoutMs: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Browser Session
// ---------------------------------------------------------------------------

export interface BrowserSession {
  id: string;
  engine: ExtractionEngineName;
  state: BrowserSessionState;
  config: BrowserSessionConfig;
  createdAt: string;
  lastActivityAt: string;
  closedAt: string | null;
  navigations: number;
  captures: number;
  failures: number;
}

// ---------------------------------------------------------------------------
// Session State Transitions
// ---------------------------------------------------------------------------

export const SESSION_STATE_TRANSITIONS: Record<BrowserSessionState, BrowserSessionState[]> = {
  created: ["active", "failed", "closed"],
  active: ["busy", "idle", "failed", "closed"],
  busy: ["active", "failed", "timeout"],
  idle: ["active", "closed", "timeout"],
  failed: ["closed", "recovered"],
  closed: [],
  recovered: ["active", "busy"],
  timeout: ["closed", "recovered"],
};

// ---------------------------------------------------------------------------
// Session Limits
// ---------------------------------------------------------------------------

export interface BrowserSessionLimits {
  maxActiveSessions: number;
  maxSessionsPerEngine: number;
  maxHistoryRecords: number;
  sessionTimeoutMs: number;
  idleTimeoutMs: number;
}

// ---------------------------------------------------------------------------
// Default Session Limits
// ---------------------------------------------------------------------------

export const DEFAULT_SESSION_LIMITS: BrowserSessionLimits = {
  maxActiveSessions: 3,
  maxSessionsPerEngine: 1,
  maxHistoryRecords: 100,
  sessionTimeoutMs: 60000,
  idleTimeoutMs: 30000,
};
