// ============================================================================
// EXTRACTION MODULE — Multi-Engine Recovery
//
// Barrel export for extraction engines with automatic fallback recovery.
// ============================================================================

export { extractWithRecovery, getExtractionMetrics, getExtractionMetricsSummary } from "./extraction-manager";
export { fetchWithJCodesMore } from "./jcodesmore-engine";
export { fetchWithFirecrawl } from "./firecrawl-engine";
