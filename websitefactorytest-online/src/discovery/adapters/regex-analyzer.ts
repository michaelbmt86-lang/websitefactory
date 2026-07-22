// ============================================================================
// REGEX ANALYZER ADAPTER
//
// Wraps the existing regex/heuristic analyzer behind the AnalyzerAdapter
// interface. This is the default adapter — zero external API calls.
// All behavior is delegated to the original gemini-analyzer module.
// ============================================================================

import type { AnalyzerAdapter } from "../analyzer-adapter";
import type { GeminiInput, GeminiOutput } from "../gemini-analyzer";
import { analyzeWithGemini } from "../gemini-analyzer";

export const regexAnalyzerAdapter: AnalyzerAdapter = {
  name: "regex",

  analyze(input: GeminiInput): GeminiOutput {
    return analyzeWithGemini(input);
  },
};
