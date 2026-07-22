// ============================================================================
// ANALYZER ADAPTER INTERFACE
//
// Minimal contract for analyzer implementations.
// All adapters must accept GeminiInput and return GeminiOutput.
// The input/output contract is frozen — do not modify.
// ============================================================================

import type { GeminiInput, GeminiOutput } from "./gemini-analyzer";

export interface AnalyzerAdapter {
  name: string;
  analyze(input: GeminiInput): GeminiOutput | Promise<GeminiOutput>;
}
