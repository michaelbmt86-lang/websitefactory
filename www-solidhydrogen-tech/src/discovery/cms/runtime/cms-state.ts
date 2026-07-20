// ============================================================================
// CMS STATE
//
// Defines CMS generation state management types and interfaces for the
// Layer 7 CMS Generation Layer. This module provides type definitions for
// generation session state tracking, phase state, and quality state only.
// ============================================================================

import type { CmsGenerationState, CmsPhaseState } from "./cms-status";
import type { CmsHealthState } from "./cms-health";
import type { CmsSessionContext } from "./cms-context";

// ---------------------------------------------------------------------------
// Phase State
// ---------------------------------------------------------------------------

export interface CmsPhaseStatus {
  name: string;
  state: CmsPhaseState;
  startTime: string;
  endTime: string | null;
  recordsGenerated: number;
  durationMs: number;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Generation State
// ---------------------------------------------------------------------------

export type CmsGenerationOutcome = "success" | "failed" | "partial" | "timeout";

export interface CmsGenerationStatus {
  id: string;
  siteUrl: string;
  state: CmsGenerationState;
  outcome: CmsGenerationOutcome | null;
  startTime: string;
  endTime: string | null;
  phasesCompleted: number;
  totalPhases: number;
  pagesGenerated: number;
  brandsGenerated: number;
  collectionsGenerated: number;
  blogPostsGenerated: number;
  seoEntriesGenerated: number;
  searchEntriesGenerated: number;
  qualityScore: number | null;
  issuesFound: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Quality State
// ---------------------------------------------------------------------------

export type CmsQualityOutcome = "pass" | "warn" | "fail" | "unknown";

export interface CmsQualityStatus {
  id: string;
  siteUrl: string;
  outcome: CmsQualityOutcome;
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  overallStatus: string;
  startTime: string;
  endTime: string | null;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Output State
// ---------------------------------------------------------------------------

export type CmsOutputOutcome = "success" | "partial" | "failed";

export interface CmsOutputStatus {
  id: string;
  siteUrl: string;
  outcome: CmsOutputOutcome;
  filesGenerated: number;
  totalFiles: number;
  manifestGenerated: boolean;
  searchIndexGenerated: boolean;
  navigationGenerated: boolean;
  sitemapGenerated: boolean;
  startTime: string;
  endTime: string | null;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// CMS State Summary
// ---------------------------------------------------------------------------

export interface CmsStateSummary {
  totalSessions: number;
  activeSessions: number;
  failedSessions: number;
  completedSessions: number;
  partialSessions: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  partialGenerations: number;
  totalQualityChecks: number;
  passedQualityChecks: number;
  warnedQualityChecks: number;
  failedQualityChecks: number;
  totalOutputDeliveries: number;
  successfulOutputDeliveries: number;
  failedOutputDeliveries: number;
  overallHealth: CmsHealthState;
  lastActivity: string | null;
}

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const CMS_GENERATION_STATE_TRANSITIONS: Record<CmsGenerationState, CmsGenerationState[]> = {
  idle: ["generating", "validating", "delivering", "failed", "timeout"],
  generating: ["validating", "completed", "failed", "partial", "timeout"],
  validating: ["delivering", "completed", "failed", "timeout"],
  delivering: ["completed", "failed", "timeout"],
  completed: ["idle"],
  failed: ["idle"],
  partial: ["idle"],
  timeout: ["idle"],
  unknown: ["idle", "generating", "validating", "delivering"],
};

export const CMS_PHASE_STATE_TRANSITIONS: Record<CmsPhaseState, CmsPhaseState[]> = {
  pending: ["running", "failed", "skipped", "timeout"],
  running: ["completed", "failed", "timeout"],
  completed: [],
  failed: [],
  skipped: [],
  timeout: [],
};

// ---------------------------------------------------------------------------
// Session State Tracker
// ---------------------------------------------------------------------------

export interface CmsSessionStateTracker {
  session: CmsSessionContext;
  generationState: CmsGenerationStatus | null;
  qualityState: CmsQualityStatus | null;
  outputState: CmsOutputStatus | null;
  phaseStates: CmsPhaseStatus[];
  lastStateChange: string;
  stateChanges: Array<{
    from: CmsGenerationState;
    to: CmsGenerationState;
    timestamp: string;
    reason: string;
  }>;
}
