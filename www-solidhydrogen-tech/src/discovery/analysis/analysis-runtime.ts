// ============================================================================
// ANALYSIS RUNTIME
//
// Defines analysis runtime metadata types and structures for the Layer 5
// AI Analysis Layer. This module provides type definitions and runtime
// structures only — no execution logic.
// ============================================================================

import type { AnalysisModuleState } from "./analysis-status";
import type { AnalysisHealthState } from "./analysis-health";

// ---------------------------------------------------------------------------
// Runtime Module Status
// ---------------------------------------------------------------------------

export interface RuntimeModuleStatus {
  name: string;
  displayName: string;
  status: AnalysisHealthState | "unknown";
  lastHealthCheck: string | null;
  lastSuccessfulAnalysis: string | null;
  lastFailedAnalysis: string | null;
  consecutiveFailures: number;
  activeAnalyses: number;
  totalAnalysesToday: number;
}

// ---------------------------------------------------------------------------
// Runtime Session State
// ---------------------------------------------------------------------------

export interface RuntimeAnalysisSessionState {
  state: AnalysisModuleState;
  count: number;
}

// ---------------------------------------------------------------------------
// Runtime Normalization Record
// ---------------------------------------------------------------------------

export interface RuntimeNormalizationRecord {
  id: string;
  url: string;
  module: string;
  status: "success" | "failed" | "partial";
  inputSizeBytes: number;
  outputSizeBytes: number;
  reductionPercent: number;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Extraction Record
// ---------------------------------------------------------------------------

export interface RuntimeExtractionRecord {
  id: string;
  url: string;
  module: string;
  status: "success" | "failed" | "partial";
  fieldsExtracted: number;
  specsExtracted: number;
  faqExtracted: number;
  imagesExtracted: number;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Generation Record
// ---------------------------------------------------------------------------

export interface RuntimeGenerationRecord {
  id: string;
  url: string;
  module: string;
  status: "success" | "failed" | "partial";
  itemsGenerated: number;
  outputSizeBytes: number;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Failure Record
// ---------------------------------------------------------------------------

export interface RuntimeAnalysisFailureRecord {
  id: string;
  url: string;
  module: string;
  type: "normalization" | "extraction" | "generation" | "validation";
  category: "parsing" | "timeout" | "data" | "unknown";
  error: string;
  recoverable: boolean;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime History Limits
// ---------------------------------------------------------------------------

export interface RuntimeAnalysisHistoryLimits {
  maxRecentNormalizations: number;
  maxRecentExtractions: number;
  maxRecentGenerations: number;
  maxRecentFailures: number;
}

export const DEFAULT_ANALYSIS_HISTORY_LIMITS: RuntimeAnalysisHistoryLimits = {
  maxRecentNormalizations: 100,
  maxRecentExtractions: 100,
  maxRecentGenerations: 100,
  maxRecentFailures: 50,
};
