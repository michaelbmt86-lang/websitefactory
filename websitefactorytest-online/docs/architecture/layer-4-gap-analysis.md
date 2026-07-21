# Layer 4 — Gap Analysis

**Date:** 2026-07-18
**Scope:** Architecture Definition + Architecture Audit (Documentation Only)

---

## Responsibility Coverage

| Responsibility | Spec Requirement | Implementation Status | Gap |
|---|---|---|---|
| R1. Launch Browser Session | Initialize browser session per engine | **Partial** | Embedded in engine functions; no isolated session abstraction |
| R2. Navigate to URL | Navigate browser to target URL | **Implemented** | Fetch calls in each engine with AbortController |
| R3. Capture DOM Content | Extract full DOM/HTML from page | **Implemented** | HTML capture in all three engines |
| R4. Handle Dynamic Rendering | Expand hidden content, lazy-loaded elements | **Implemented** | `dynamic-renderer.ts` + `jcodesmore-engine.ts` expandHiddenContent |
| R5. Discover Page Assets | Identify and catalog page assets | **Partial** | Firecrawl engine extracts JSON-LD/noscript; no formal asset manifest |
| R6. Handle Lazy Loading | Convert data-src, expand noscript, remove lazy constraints | **Implemented** | `jcodesmore-engine.ts` extractLazyContent + `dynamic-renderer.ts` |
| R7. Expand Hidden Content | Remove display:none, height:0, aria-hidden | **Implemented** | `jcodesmore-engine.ts` expandHiddenContent + `dynamic-renderer.ts` |
| R8. Manage Browser Recovery | Handle browser failures, report to Layer 3 | **Partial** | Engine fallback chain exists; no browser-specific recovery events |
| R9. Monitor Browser Health | Track browser session health metrics | **Missing** | No browser health monitoring; extraction metrics only at Layer 3 |
| R10. Report Browser Metrics | Record browser-level performance data | **Missing** | No browser-specific metrics; only extraction-level metrics |
| R11. Execute Browser Cleanup | Clean up browser session resources | **Missing** | No session cleanup logic; fetch-based engines auto-cleanup |
| R12. Validate Browser Output | Validate HTML meets minimum quality thresholds | **Partial** | Basic length checks in engines; no structured validation |
| R13. Report Browser Extraction Status | Return structured browser status to Layer 3 | **Missing** | No browser status interface; Layer 3 infers from engine results |

**Coverage: 5/13 fully implemented, 5/13 partial, 3/13 missing**

---

## Extraction Flow Audit

| Step | Status | Notes |
|---|---|---|
| Chrome DevTools MCP fetch | **Implemented** | `extraction-manager.ts:fetchWithChromeDevTools()` |
| JCodesMore browser-like fetch | **Implemented** | `jcodesmore-engine.ts:fetchWithJCodesMore()` |
| Firecrawl API fetch | **Implemented** | `firecrawl-engine.ts:fetchViaFirecrawlApi()` |
| Firecrawl fallback parser | **Implemented** | `firecrawl-engine.ts:fetchViaFallbackParser()` |
| Dynamic rendering preparation | **Implemented** | `dynamic-renderer.ts:prepareHtmlForExtraction()` |
| Lazy-load content expansion | **Implemented** | `jcodesmore-engine.ts:extractLazyContent()` |
| Hidden content expansion | **Implemented** | `jcodesmore-engine.ts:expandHiddenContent()` |
| Content length validation | **Implemented** | Basic length checks in all engines |
| Browser session lifecycle | **Missing** | No session start/end tracking |
| Browser health monitoring | **Missing** | No health score or error rate tracking |
| Browser metrics reporting | **Missing** | No browser-specific metrics |
| Browser session cleanup | **Missing** | No explicit cleanup (fetch auto-cleans) |

**Flow Coverage: 8/12 steps implemented, 4/12 missing**

---

## Layer Boundary Compliance

| Boundary | Status | Notes |
|---|---|---|
| Layer 3 → Layer 4 (Browser) | **Implicit** | Layer 3 calls engine functions directly; no formal interface |
| Layer 4 → HTML Output | **Implemented** | Raw HTML returned to Layer 3 |
| Layer 4 → Layer 3 (Recovery) | **Implemented** | Engine failures propagate to Layer 3 |
| Layer 4 → Dynamic Renderer | **Implemented** | `dynamic-renderer.ts` called by engine functions |
| Layer 4 → DOM Extractor | **Implemented** | `dom-extractor.ts` used for content extraction |

### Boundary Violations

| Violation | Location | Description |
|---|---|---|
| Layer 4 calls DOM Extractor | `extraction-with-recovery.ts` | RecoveryExtractionEngine calls `dom-extractor.ts` functions directly. DOM extraction is a Layer 3 responsibility (output normalization). Layer 4 should only provide raw HTML. |
| Layer 4 calls Gemini Analyzer | `extraction-with-recovery.ts` | RecoveryExtractionEngine calls `gemini-analyzer.ts`. Gemini analysis is Layer 3 responsibility. |
| Layer 4 manages SQLite | `extraction-with-recovery.ts` | RecoveryExtractionEngine writes to SQLite directly. Data storage is Layer 3 responsibility. |
| Layer 4 manages state | `extraction-with-recovery.ts` | RecoveryExtractionEngine tracks extractedCount, failedCount, retriedCount. State management is Layer 3 responsibility. |
| Layer 4 validates extraction quality | `extraction-with-recovery.ts` | RecoveryExtractionEngine calls quality-validator.ts. Quality validation is Layer 3 responsibility. |

---

## Policy Usage Audit

| Policy | Used By | Enforcement Status |
|---|---|---|
| Engine Priority (fixed chain) | Engine selection in extraction-manager.ts | **Implemented** — Fixed priority, Firecrawl never primary |
| Timeout (AbortController) | All engine fetch calls | **Partial** — Per-fetch timeout; no policy-driven timeout |
| Retry (exponential backoff) | extraction-manager.ts | **Implemented** — But this is Layer 3 responsibility |

### Missing Policies

| Policy | Status | Impact |
|---|---|---|
| Browser session timeout policy | **Missing** | No configurable session lifetime |
| Browser health threshold policy | **Missing** | No health score triggers |
| Asset discovery policy | **Missing** | No rules for which assets to capture |
| Content validation policy | **Missing** | No minimum HTML quality thresholds |

---

## Engine Implementation Audit

| Engine | File | Status | Notes |
|---|---|---|---|
| Chrome DevTools MCP | `extraction-manager.ts` | **Implemented** | Primary; HTTP fetch via `fetchText()` |
| JCodesMore Browser | `jcodesmore-engine.ts` | **Implemented** | Recovery L1; browser-like headers + DOM simulation |
| Firecrawl | `firecrawl-engine.ts` | **Implemented** | Recovery L2; API call or fallback parser |

### Engine Feature Matrix

| Feature | Chrome DevTools MCP | JCodesMore | Firecrawl |
|---|---|---|---|
| Raw HTML capture | ✅ | ✅ | ✅ |
| Title extraction | ✅ | ✅ | ✅ |
| Dynamic rendering | ❌ | ✅ | ❌ |
| Lazy-load expansion | ❌ | ✅ | ❌ |
| Hidden content expansion | ❌ | ✅ | ❌ |
| Asset discovery (JSON-LD) | ❌ | ❌ | ✅ |
| Asset discovery (noscript) | ❌ | ✅ | ✅ |
| Multiple user agents | ❌ | ❌ | ✅ |
| AbortController timeout | ✅ | ✅ | ✅ |
| Content length validation | ✅ | ✅ | ✅ |
| Browser session tracking | ❌ | ❌ | ❌ |
| Health monitoring | ❌ | ❌ | ❌ |
| Metrics reporting | ❌ | ❌ | ❌ |

---

## Dead Code Audit

| File/Function | Status | Notes |
|---|---|---|
| `jcodesmore-engine.ts` | **Active** | Recovery L1 engine |
| `firecrawl-engine.ts` | **Active** | Recovery L2 engine |
| `extraction-manager.ts` | **Active** | Engine registry + primary engine |
| `dynamic-renderer.ts` | **Active** | HTML preparation |
| `dom-extractor.ts` | **Active** | DOM data extraction |
| `extraction-with-recovery.ts` | **Active** | RecoveryExtractionEngine (mixed Layer 3/4) |
| `detail-extraction-engine.ts` | **Active** | DetailExtractionEngine (Layer 3) |

**Dead Code: None identified in Layer 4 browser subsystem**

---

## Upgrade Readiness

### What Is Ready

| Component | Readiness |
|---|---|
| Three-engine browser extraction | Production-ready |
| Dynamic rendering (server-side simulation) | Production-ready |
| Lazy-load content expansion | Production-ready |
| Hidden content expansion | Production-ready |
| Basic content validation | Production-ready |
| Engine fallback chain | Production-ready |

### What Needs Formalization for Layer 4 Spec Compliance

| Priority | Item | Effort |
|---|---|---|
| **High** | Extract browser session abstraction from engine functions | Medium |
| **High** | Create browser metrics tracking (response time, success/failure per engine) | Small |
| **High** | Create browser health monitoring (health score per engine) | Small |
| **Medium** | Create formal asset discovery module (JSON-LD, noscript, meta, images) | Medium |
| **Medium** | Create browser status interface for Layer 3 consumption | Small |
| **Medium** | Create browser session cleanup module | Small |
| **Medium** | Create content validation module (minimum HTML quality thresholds) | Small |
| **Low** | Add browser memory monitoring | Medium |
| **Low** | Add browser concurrency controls | Small |

### Recommended Next Steps

1. **Create `src/discovery/browser/session-manager.ts`** — Isolate browser session lifecycle from engine functions
2. **Create `src/discovery/browser/health-monitor.ts`** — Track browser health per engine
3. **Create `src/discovery/browser/metrics-reporter.ts`** — Record browser-level performance data
4. **Create `src/discovery/browser/asset-discovery.ts`** — Formalize asset discovery across all engines
5. **Create `src/discovery/browser/content-validator.ts`** — Validate HTML quality before returning to Layer 3
6. **Separate Layer 3 concerns from `extraction-with-recovery.ts`** — DOM extraction, Gemini analysis, SQLite, and quality validation belong to Layer 3
7. **Create `src/discovery/browser/status-reporter.ts`** — Structured browser status for Layer 3

### Boundary Cleanup Required

| Item | Current Location | Target Location |
|---|---|---|
| DOM extraction calls | `extraction-with-recovery.ts` | Layer 3 (normalize) |
| Gemini analysis calls | `extraction-with-recovery.ts` | Layer 3 (normalize) |
| SQLite writes | `extraction-with-recovery.ts` | Layer 3 (store) |
| State tracking | `extraction-with-recovery.ts` | Layer 3 (state) |
| Quality validation | `extraction-with-recovery.ts` | Layer 3 (validate) |
