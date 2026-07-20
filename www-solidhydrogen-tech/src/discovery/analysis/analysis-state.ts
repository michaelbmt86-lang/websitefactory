// ============================================================================
// ANALYSIS STATE
//
// Defines analysis state management types and interfaces for the Layer 5
// AI Analysis Layer. This module provides type definitions for analysis
// session state tracking, normalization state, and generation state only.
// ============================================================================

import type { AnalysisModuleState } from "./analysis-status";
import type { AnalysisHealthState } from "./analysis-health";
import type { AnalysisSessionContext } from "./analysis-context";

// ---------------------------------------------------------------------------
// Normalization State
// ---------------------------------------------------------------------------

export type NormalizationState = "pending" | "normalizing" | "completed" | "failed" | "partial";

export interface NormalizationStatus {
  url: string;
  state: NormalizationState;
  module: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  inputSizeBytes: number;
  outputSizeBytes: number;
}

// ---------------------------------------------------------------------------
// Extraction State
// ---------------------------------------------------------------------------

export type ExtractionState = "pending" | "extracting" | "completed" | "failed" | "partial";

export interface ExtractionStatus {
  url: string;
  state: ExtractionState;
  module: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  fieldsExtracted: number;
  specsExtracted: number;
  faqExtracted: number;
}

// ---------------------------------------------------------------------------
// Generation State
// ---------------------------------------------------------------------------

export type GenerationState = "pending" | "generating" | "completed" | "failed" | "partial";

export interface GenerationStatus {
  url: string;
  state: GenerationState;
  module: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  itemsGenerated: number;
  outputSizeBytes: number;
}

// ---------------------------------------------------------------------------
// Validation State
// ---------------------------------------------------------------------------

export type ValidationState = "pending" | "validating" | "completed" | "failed";

export interface ValidationStatus {
  url: string;
  state: ValidationState;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  qualityScore: number;
  issuesFound: number;
}

// ---------------------------------------------------------------------------
// Analysis State Summary
// ---------------------------------------------------------------------------

export interface AnalysisStateSummary {
  totalSessions: number;
  activeSessions: number;
  failedSessions: number;
  completedSessions: number;
  totalNormalizations: number;
  successfulNormalizations: number;
  failedNormalizations: number;
  totalExtractions: number;
  successfulExtractions: number;
  failedExtractions: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  overallHealth: AnalysisHealthState;
  lastActivity: string | null;
}

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const NORMALIZATION_STATE_TRANSITIONS: Record<NormalizationState, NormalizationState[]> = {
  pending: ["normalizing", "failed"],
  normalizing: ["completed", "failed", "partial"],
  completed: [],
  failed: [],
  partial: [],
};

export const EXTRACTION_STATE_TRANSITIONS: Record<ExtractionState, ExtractionState[]> = {
  pending: ["extracting", "failed"],
  extracting: ["completed", "failed", "partial"],
  completed: [],
  failed: [],
  partial: [],
};

export const GENERATION_STATE_TRANSITIONS: Record<GenerationState, GenerationState[]> = {
  pending: ["generating", "failed"],
  generating: ["completed", "failed", "partial"],
  completed: [],
  failed: [],
  partial: [],
};

export const VALIDATION_STATE_TRANSITIONS: Record<ValidationState, ValidationState[]> = {
  pending: ["validating", "failed"],
  validating: ["completed", "failed"],
  completed: [],
  failed: [],
};

// ---------------------------------------------------------------------------
// Session State Tracker
// ---------------------------------------------------------------------------

export interface AnalysisSessionStateTracker {
  session: AnalysisSessionContext;
  normalizationState: NormalizationStatus | null;
  extractionState: ExtractionStatus | null;
  generationState: GenerationStatus | null;
  validationState: ValidationStatus | null;
  lastStateChange: string;
  stateChanges: Array<{
    from: AnalysisModuleState;
    to: AnalysisModuleState;
    timestamp: string;
    reason: string;
  }>;
}
