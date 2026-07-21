// ============================================================================
// EXTRACTION MODULE — Multi-Engine Recovery
//
// Barrel export for extraction engines with automatic fallback recovery.
// ============================================================================

export { extractWithRecovery, getExtractionMetrics, getExtractionMetricsSummary } from "./extraction-manager";
export { fetchWithJCodesMore } from "./jcodesmore-engine";
export { fetchWithFirecrawl } from "./firecrawl-engine";
export { validateAcquisition } from "./acquisition-validator";
export { DEFAULT_VALIDATOR_CONFIG, SCORE_WEIGHTS, createValidatorConfig } from "./validator-config";
export { ALL_ANTI_BOT_PATTERNS, PATTERN_CATEGORIES, getPatternsByCategory, createCustomPattern } from "./anti-bot-patterns";
