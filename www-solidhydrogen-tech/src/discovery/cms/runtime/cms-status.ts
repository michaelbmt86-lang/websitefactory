// ============================================================================
// CMS STATUS
//
// Defines CMS generation status types, phase states, and status monitoring
// interfaces for the Layer 7 CMS Generation Layer. This module provides type
// definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// CMS Generation States
// ---------------------------------------------------------------------------

export type CmsGenerationState =
  | "idle"
  | "generating"
  | "validating"
  | "delivering"
  | "completed"
  | "failed"
  | "partial"
  | "timeout"
  | "unknown";

// ---------------------------------------------------------------------------
// CMS Phase States
// ---------------------------------------------------------------------------

export type CmsPhaseState =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "timeout";

// ---------------------------------------------------------------------------
// Overall CMS Status
// ---------------------------------------------------------------------------

export type OverallCmsStatus =
  | "idle"
  | "generating"
  | "completed"
  | "failed"
  | "partial"
  | "unknown";

// ---------------------------------------------------------------------------
// CMS Phase Status Definition
// ---------------------------------------------------------------------------

export interface CmsPhaseStatusDefinition {
  name: string;
  displayName: string;
  state: CmsPhaseState;
  recordsGenerated: number;
  durationMs: number;
  lastRun: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// CMS Table Status Definition
// ---------------------------------------------------------------------------

export interface CmsTableStatusDefinition {
  name: string;
  rowCount: number;
  lastWrite: string | null;
  status: CmsGenerationState;
}

// ---------------------------------------------------------------------------
// CMS Output File Status
// ---------------------------------------------------------------------------

export interface CmsOutputFileStatus {
  exists: boolean;
  sizeBytes: number;
  lastGenerated: string | null;
}

// ---------------------------------------------------------------------------
// CMS Status Summary
// ---------------------------------------------------------------------------

export interface CmsStatusSummary {
  overallStatus: OverallCmsStatus;
  currentPhase: string | null;
  phasesCompleted: number;
  totalPhases: number;
  lastGeneration: string | null;
  lastSuccessfulGeneration: string | null;
  lastFailedGeneration: string | null;
  consecutiveFailures: number;
  activeGenerations: number;
  phases: Record<string, CmsPhaseStatusDefinition>;
  tables: Record<string, CmsTableStatusDefinition>;
  outputFiles: Record<string, CmsOutputFileStatus>;
  lastUpdated: string | null;
}

// ---------------------------------------------------------------------------
// State Definitions
// ---------------------------------------------------------------------------

export const CMS_GENERATION_STATE_DEFINITIONS: Record<CmsGenerationState, string> = {
  idle: "CMS generation is idle, not generating",
  generating: "CMS generation is actively generating content",
  validating: "CMS generation is validating quality",
  delivering: "CMS generation is packaging output files",
  completed: "CMS generation completed successfully",
  failed: "CMS generation failed",
  partial: "CMS generation completed partially",
  timeout: "CMS generation timed out",
  unknown: "CMS generation status is unknown",
};

// ---------------------------------------------------------------------------
// Phase State Definitions
// ---------------------------------------------------------------------------

export const CMS_PHASE_STATE_DEFINITIONS: Record<CmsPhaseState, string> = {
  pending: "Phase has not started",
  running: "Phase is currently running",
  completed: "Phase completed successfully",
  failed: "Phase failed",
  skipped: "Phase was skipped",
  timeout: "Phase timed out",
};

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const CMS_STATE_TRANSITIONS: Record<CmsGenerationState, CmsGenerationState[]> = {
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
