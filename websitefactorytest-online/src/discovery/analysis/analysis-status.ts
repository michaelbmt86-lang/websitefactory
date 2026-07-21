// ============================================================================
// ANALYSIS STATUS
//
// Defines analysis status types, module states, and status monitoring
// interfaces for the Layer 5 AI Analysis Layer. This module provides type
// definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Analysis Module States
// ---------------------------------------------------------------------------

export type AnalysisModuleState =
  | "idle"
  | "normalizing"
  | "extracting"
  | "analyzing"
  | "generating"
  | "validating"
  | "completed"
  | "failed"
  | "timeout"
  | "unknown";

// ---------------------------------------------------------------------------
// Overall Analysis Status
// ---------------------------------------------------------------------------

export type OverallAnalysisStatus =
  | "idle"
  | "processing"
  | "completed"
  | "failed"
  | "partial"
  | "unknown";

// ---------------------------------------------------------------------------
// Module Status Definition
// ---------------------------------------------------------------------------

export interface AnalysisModuleStatusDefinition {
  name: string;
  displayName: string;
  state: AnalysisModuleState;
  lastHealthCheck: string | null;
  lastSuccessfulAnalysis: string | null;
  lastFailedAnalysis: string | null;
  consecutiveFailures: number;
  activeAnalyses: number;
  totalAnalysesToday: number;
}

// ---------------------------------------------------------------------------
// Status State Definitions
// ---------------------------------------------------------------------------

export const ANALYSIS_MODULE_STATE_DEFINITIONS: Record<AnalysisModuleState, string> = {
  idle: "Module is idle, not processing any analysis",
  normalizing: "Module is normalizing input data (HTML, CSS, media)",
  extracting: "Module is extracting semantic data from normalized input",
  analyzing: "Module is running Gemini/heuristic analysis",
  generating: "Module is generating structured output (JSON, CMS, SEO)",
  validating: "Module is validating analysis output quality",
  completed: "Module completed analysis successfully",
  failed: "Module failed during analysis",
  timeout: "Module timed out during analysis",
  unknown: "Module status is unknown",
};

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const ANALYSIS_STATE_TRANSITIONS: Record<AnalysisModuleState, AnalysisModuleState[]> = {
  idle: ["normalizing", "extracting", "analyzing", "generating", "validating", "failed", "timeout"],
  normalizing: ["extracting", "completed", "failed", "timeout"],
  extracting: ["analyzing", "completed", "failed", "timeout"],
  analyzing: ["generating", "completed", "failed", "timeout"],
  generating: ["validating", "completed", "failed", "timeout"],
  validating: ["completed", "failed", "timeout"],
  completed: ["idle"],
  failed: ["idle"],
  timeout: ["idle"],
  unknown: ["idle", "normalizing", "extracting", "analyzing", "generating", "validating"],
};

// ---------------------------------------------------------------------------
// Analysis Status Summary
// ---------------------------------------------------------------------------

export interface AnalysisStatusSummary {
  overallStatus: OverallAnalysisStatus;
  activeAnalyses: number;
  totalAnalysesToday: number;
  modules: AnalysisModuleStatusDefinition[];
  lastUpdated: string | null;
}
