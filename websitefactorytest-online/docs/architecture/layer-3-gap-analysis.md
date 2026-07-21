# Layer 3 — Gap Analysis

**Date:** 2026-07-18
**Scope:** Architecture Definition + Architecture Audit (Documentation Only)

---

## Responsibility Coverage

| Responsibility | Spec Requirement | Implementation Status | Gap |
|---|---|---|---|
| R1. Orchestrate Multi-Engine Extraction | Coordinate 3 engines with deterministic fallback | **Implemented** | — |
| R2. Monitor Engine Health | Track success/failure rates per engine | **Partial** | Metrics stored but no health dashboard |
| R3. Detect Extraction Failures | Identify and categorize failure reasons | **Partial** | Basic detection; no failure categorization |
| R4. Retry Failed Extractions | Retry with configurable budget and backoff | **Implemented** | — |
| R5. Execute Recovery Switching | Switch to next engine in priority chain | **Implemented** | — |
| R6. Normalize Extraction Output | Transform raw HTML to ExtractedProduct | **Implemented** | — |
| R7. Validate Extraction Quality | Assess extraction completeness | **Implemented** | — |
| R8. Track Extraction Metrics | Record performance data | **Implemented** | — |
| R9. Generate Extraction Reports | Produce structured reports | **Implemented** | — |
| R10. Manage Extraction State | Track product extraction status | **Implemented** | — |
| R11. Resume Interrupted Extractions | Resume from point of failure | **Implemented** | — |
| R12. Coordinate Concurrency | Manage parallel extraction | **Implemented** | — |
| R13. Report Extraction Status | Return status to Layer 2 | **Implemented** | — |

**Coverage: 11/13 fully implemented, 2/13 partial, 0/13 missing**

---

## Extraction Flow Audit

| Step | Status | Notes |
|---|---|---|
| Primary engine attempt (Chrome DevTools MCP) | **Implemented** | `extraction-manager.ts:extractWithEngine()` |
| Primary engine failure detection | **Implemented** | Success/failure check in extraction loop |
| Retry with backoff | **Implemented** | `retryWithBackoff()` in extraction-manager.ts |
| Recovery L1 switch (JCodesMore) | **Implemented** | Fallback chain in `extractWithRecovery()` |
| Recovery L1 failure detection | **Implemented** | Success/failure check in recovery loop |
| Recovery L2 switch (Firecrawl) | **Implemented** | Second fallback in `extractWithRecovery()` |
| Recovery L2 failure detection | **Implemented** | Success/failure check in recovery loop |
| Terminal failure recording | **Implemented** | `recordExtractionFailure()` in extraction-manager.ts |
| Output normalization | **Implemented** | `normalizeExtractedData()` in detail-extraction-engine.ts |
| Quality validation | **Implemented** | `validateExtractionQuality()` in quality-validator.ts |
| Metrics tracking | **Implemented** | `recordExtractionMetrics()` in extraction-manager.ts |
| State management | **Implemented** | Status updates in extracted_products table |

**Flow Coverage: 12/12 steps implemented**

---

## Layer Boundary Compliance

| Boundary | Status | Notes |
|---|---|---|
| Layer 2 → Layer 3 (Extraction Manager) | **Well-Defined** | API route `/api/detail-extraction` is clear interface |
| Layer 3 → SQLite | **Implemented** | Direct DB access in extraction-manager.ts, detail-extraction-engine.ts |
| Layer 3 → Chrome DevTools MCP | **Implemented** | External tool invocation |
| Layer 3 → JCodesMore Engine | **Implemented** | Internal engine module |
| Layer 3 → Firecrawl Engine | **Implemented** | External API or fallback parser |
| Layer 3 → Dashboard | **Implemented** | GET /api/detail-extraction feeds dashboard |

### Boundary Violations

| Violation | Location | Description |
|---|---|---|
| Layer 3 writes to SQLite directly | `extraction-manager.ts`, `detail-extraction-engine.ts` | Extraction Manager bypasses Layer 2 for data storage. Acceptable for performance but violates Layer 2 as "conductor" principle. |
| Layer 3 calls Gemini Analyzer | `extraction-with-recovery.ts` | RecoveryExtractionEngine directly invokes Gemini Analyzer for heuristic normalization. This is appropriate as Gemini is a Layer 3 subsystem. |

---

## Policy Usage Audit

| Policy | Used By | Enforcement Status |
|---|---|---|
| Retry Policy (extractionEngines) | R4 Retry Failed Extractions | **Implemented** — maxAttempts: 2, delayMs: 2000, backoffMultiplier: 2 |
| Architecture Lock (engine priority) | R5 Recovery Switching | **Implemented** — Fixed priority chain, Firecrawl never primary |
| Retry Policy (apiCalls) | Firecrawl API calls | **Implemented** — ECONNRESET, ETIMEDOUT, 429, 500-504 retryable |

### Missing Policies

| Policy | Status | Impact |
|---|---|---|
| Extraction timeout policy | **Missing** | No per-URL timeout enforcement; relies on engine defaults |
| Concurrency limit policy | **Missing** | Hardcoded in API route (default: 3); not configurable via policy |
| Quality threshold policy | **Missing** | Quality validation is advisory; no minimum score for storage |
| Rate limit policy | **Missing** | No per-engine rate limiting; relies on engine defaults |

---

## Workflow Coverage Audit

| Workflow | Entry Point | Status |
|---|---|---|
| Detail Extraction (with recovery) | POST /api/detail-extraction (useRecovery: true) | **Implemented** |
| Detail Extraction (without recovery) | POST /api/detail-extraction (useRecovery: false) | **Implemented** |
| Extraction Status Check | GET /api/detail-extraction | **Implemented** |
| Recovery Dashboard | /dashboard/extraction-recovery | **Implemented** |

---

## Engine Implementation Audit

| Engine | File | Status | Notes |
|---|---|---|---|
| Chrome DevTools MCP | External tool | **Implemented** | Primary engine; invoked via MCP protocol |
| JCodesMore Browser | `jcodesmore-engine.ts` | **Implemented** | Recovery L1; browser-like headers fetch with lazy-load triggering |
| Firecrawl | `firecrawl-engine.ts` | **Implemented** | Recovery L2; API call with fallback parser |

### Engine Health

| Engine | Success Rate | Avg Duration | Notes |
|---|---|---|---|
| Chrome DevTools MCP | Unknown (no tracking) | Unknown | Primary engine; health not tracked |
| JCodesMore Browser | Unknown (no tracking) | Unknown | Recovery L1; health not tracked |
| Firecrawl | Unknown (no tracking) | Unknown | Recovery L2; health not tracked |

**Gap:** Engine health metrics are stored in extraction_metrics but not aggregated into per-engine health dashboards.

---

## Dead Code Audit

| File/Function | Status | Notes |
|---|---|---|
| `detail-extraction-engine.ts` | **Active** | Used when `useRecovery: false` in API route |
| `extraction-with-recovery.ts` | **Active** | Used when `useRecovery: true` in API route |
| `extraction-manager.ts` | **Active** | Core extraction manager; used by both engines |
| `jcodesmore-engine.ts` | **Active** | Recovery L1 engine |
| `firecrawl-engine.ts` | **Active** | Recovery L2 engine |
| `dom-extractor.ts` | **Active** | DOM data extraction |
| `media-extractor.ts` | **Active** | Media asset extraction |
| `gemini-analyzer.ts` | **Active** | Heuristic normalization |
| `quality-validator.ts` | **Active** | Extraction quality validation |

**Dead Code: None identified in Layer 3 extraction subsystem**

---

## Upgrade Readiness

### What Is Ready

| Component | Readiness |
|---|---|
| Multi-engine extraction with fallback | Production-ready |
| Retry with exponential backoff | Production-ready |
| Recovery switching (Chrome DevTools → JCodesMore → Firecrawl) | Production-ready |
| Output normalization | Production-ready |
| Quality validation | Production-ready |
| Metrics tracking | Production-ready |
| State management | Production-ready |
| Concurrency control | Production-ready |
| API interface | Production-ready |
| Dashboard integration | Production-ready |

### What Needs Formalization for Layer 3 Spec Compliance

| Priority | Item | Effort |
|---|---|---|
| **High** | Add per-engine health dashboard to extraction-recovery page | Small |
| **High** | Implement failure categorization (network, timeout, parsing, rate-limit, unknown) | Small |
| **Medium** | Add extraction timeout policy to policies/ | Small |
| **Medium** | Add concurrency limit policy to policies/ | Small |
| **Medium** | Add quality threshold policy to policies/ | Small |
| **Medium** | Add rate limit policy to policies/ | Small |
| **Low** | Aggregate engine health metrics into per-engine dashboards | Medium |
| **Low** | Add extraction cost tracking (API calls, tokens) | Medium |

### Recommended Next Steps

1. **Add failure categorization** to `recordExtractionFailure()` in extraction-manager.ts
2. **Create extraction timeout policy** in `policies/extraction-timeout-policy.json`
3. **Create concurrency limit policy** in `policies/concurrency-limit-policy.json`
4. **Create quality threshold policy** in `policies/quality-threshold-policy.json`
5. **Create rate limit policy** in `policies/rate-limit-policy.json`
6. **Add per-engine health cards** to extraction-recovery dashboard page
7. **Aggregate engine health metrics** in getExtractionMetricsSummary()
