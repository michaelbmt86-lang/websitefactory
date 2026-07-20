// ============================================================================
// CMS RUNTIME
//
// Defines CMS generation runtime metadata types and structures for the
// Layer 7 CMS Generation Layer. This module provides type definitions and
// runtime structures only — no execution logic.
// ============================================================================

import type { CmsGenerationState, CmsPhaseState } from "./cms-status";

// ---------------------------------------------------------------------------
// Runtime Phase Status
// ---------------------------------------------------------------------------

export interface RuntimeCmsPhaseStatus {
  name: string;
  displayName: string;
  state: CmsPhaseState;
  recordsGenerated: number;
  durationMs: number;
  lastRun: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Runtime Table Status
// ---------------------------------------------------------------------------

export interface RuntimeCmsTableStatus {
  name: string;
  rowCount: number;
  lastWrite: string | null;
  status: CmsGenerationState;
}

// ---------------------------------------------------------------------------
// Runtime Output File Status
// ---------------------------------------------------------------------------

export interface RuntimeCmsOutputFileStatus {
  exists: boolean;
  sizeBytes: number;
  lastGenerated: string | null;
}

// ---------------------------------------------------------------------------
// Runtime Generation Record
// ---------------------------------------------------------------------------

export interface RuntimeCmsGenerationRecord {
  id: string;
  siteUrl: string;
  status: "success" | "failed" | "partial";
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
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Quality Record
// ---------------------------------------------------------------------------

export interface RuntimeCmsQualityRecord {
  id: string;
  siteUrl: string;
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  overallStatus: string;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Failure Record
// ---------------------------------------------------------------------------

export interface RuntimeCmsFailureRecord {
  id: string;
  siteUrl: string;
  phase: string;
  type: "data" | "write" | "output" | "validation" | "unknown";
  error: string;
  recoverable: boolean;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime History Limits
// ---------------------------------------------------------------------------

export interface RuntimeCmsHistoryLimits {
  maxRecentGenerations: number;
  maxRecentQualityChecks: number;
  maxRecentOutputFiles: number;
  maxRecentFailures: number;
}

export const DEFAULT_CMS_HISTORY_LIMITS: RuntimeCmsHistoryLimits = {
  maxRecentGenerations: 50,
  maxRecentQualityChecks: 50,
  maxRecentOutputFiles: 50,
  maxRecentFailures: 50,
};

// ---------------------------------------------------------------------------
// Runtime CMS Status
// ---------------------------------------------------------------------------

export interface RuntimeCmsStatus {
  overallStatus: CmsGenerationState;
  currentPhase: string | null;
  phasesCompleted: number;
  totalPhases: number;
  lastGeneration: string | null;
  lastSuccessfulGeneration: string | null;
  lastFailedGeneration: string | null;
  consecutiveFailures: number;
  activeGenerations: number;
  phases: Record<string, RuntimeCmsPhaseStatus>;
  tables: Record<string, RuntimeCmsTableStatus>;
  outputFiles: Record<string, RuntimeCmsOutputFileStatus>;
}
