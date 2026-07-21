# Layer 3 — Extraction Manager

## Layer Name

**Layer 3 — Extraction Manager**

## Primary Purpose

Layer 3 Extraction Manager is the extraction subsystem of the Website Factory pipeline. It owns ALL extraction orchestration: engine selection, monitoring, failure detection, retry, recovery switching, output normalization, and reports. It coordinates three extraction engines (Chrome DevTools MCP as primary, JCodesMore as Recovery Level 1, Firecrawl as Recovery Level 2) with deterministic fallback, retry logic, and quality validation.

Layer 3 Extraction Manager does NOT store data, generate CMS, deploy, render UI, or manage Dashboard. It is the **extraction brain** that orchestrates data acquisition from target websites.

---

## Engine Priority Chain

```
Primary: Chrome DevTools MCP
    ↓ (on failure)
Recovery Level 1: JCodesMore Browser
    ↓ (on failure)
Recovery Level 2: Firecrawl
    ↓ (on failure)
Terminal failure — record failure reason, skip product
```

**Critical Constraint:** Firecrawl must NEVER become primary. Engine priority is FIXED and cannot be reordered.

---

## Responsibilities

### R1. Orchestrate Multi-Engine Extraction

| Attribute | Detail |
|---|---|
| **Purpose** | Coordinate extraction across three engines with deterministic fallback |
| **Input** | Target URL, extraction options (concurrency, maxRetries, resumeFromFailure) |
| **Output** | ExtractionResult with products, metrics, recovery status |
| **Dependencies** | Chrome DevTools MCP, JCodesMore Engine, Firecrawl Engine |
| **Failure Behaviour** | Attempt next engine in priority chain; record failure reason if all engines fail |

### R2. Monitor Engine Health

| Attribute | Detail |
|---|---|
| **Purpose** | Track success/failure rates, response times, and error patterns per engine |
| **Input** | Engine execution results (success, duration, error) |
| **Output** | EngineHealthStatus with success rate, avg duration, error distribution |
| **Dependencies** | ExtractionMetrics table in SQLite |
| **Failure Behaviour** | Log health degradation; do not auto-switch engines (priority chain is fixed) |

### R3. Detect Extraction Failures

| Attribute | Detail |
|---|---|
| **Purpose** | Identify failed extractions and categorize failure reasons |
| **Input** | Extraction attempt results, product status |
| **Output** | FailureCategory (network, timeout, parsing, rate-limit, unknown) |
| **Dependencies** | ExtractionEngineResult type |
| **Failure Behaviour** | Categorize unknown failures; log for manual review |

### R4. Retry Failed Extractions

| Attribute | Detail |
|---|---|
| **Purpose** | Retry failed extractions with configurable budget and backoff |
| **Input** | Failed extraction, retry policy (maxAttempts, delayMs, backoffMultiplier) |
| **Output** | RetryResult with success/failure and attempt count |
| **Dependencies** | policies/retry-policy.json extractionEngines rules |
| **Failure Behaviour** | Exhaust retries per policy; escalate to next engine in priority chain |

### R5. Execute Recovery Switching

| Attribute | Detail |
|---|---|
| **Purpose** | Switch to next engine in priority chain when primary fails |
| **Input** | Failed engine name, failure reason, target URL |
| **Output** | RecoveryResult with new engine name, recovery status |
| **Dependencies** | Engine priority chain (Chrome DevTools → JCodesMore → Firecrawl) |
| **Failure Behaviour** | Never skip engines; never promote Firecrawl to primary |

### R6. Normalize Extraction Output

| Attribute | Detail |
|---|---|
| **Purpose** | Transform raw engine output into standardized ExtractedProduct format |
| **Input** | Raw HTML, engine name, extraction metadata |
| **Output** | ExtractedProduct with all fields populated (title, description, images, specs, SEO, schema, FAQ) |
| **Dependencies** | DOM Extractor, Gemini Analyzer (heuristic normalization) |
| **Failure Behaviour** | Mark product as partial if normalization fails; log missing fields |

### R7. Validate Extraction Quality

| Attribute | Detail |
|---|---|
| **Purpose** | Assess extraction completeness and quality before storage |
| **Input** | ExtractedProduct, quality thresholds |
| **Output** | QualityReport with score, issues, missing fields |
| **Dependencies** | quality-validator.ts |
| **Failure Behaviour** | Flag low-quality extractions; do not block storage (quality is advisory) |

### R8. Track Extraction Metrics

| Attribute | Detail |
|---|---|
| **Purpose** | Record extraction performance data for monitoring and reporting |
| **Input** | Extraction attempt data (URL, engine, duration, success, attempts) |
| **Output** | ExtractionMetrics record in SQLite |
| **Dependencies** | extraction_metrics table in SQLite |
| **Failure Behaviour** | Log metric recording failure; do not block extraction |

### R9. Generate Extraction Reports

| Attribute | Detail |
|---|---|
| **Purpose** | Produce structured reports on extraction performance and health |
| **Input** | ExtractionMetrics, ExtractionResult data |
| **Output** | ExtractionReport with summary, engine breakdown, failure analysis |
| **Dependencies** | ExtractionMetrics table, getExtractionMetricsSummary() |
| **Failure Behaviour** | Use cached data if fresh metrics unavailable |

### R10. Manage Extraction State

| Attribute | Detail |
|---|---|
| **Purpose** | Track extraction progress per product (pending, extracting, completed, failed, retrying) |
| **Input** | Product URL, extraction status |
| **Output** | Updated product status in extracted_products table |
| **Dependencies** | extracted_products table in SQLite |
| **Failure Behaviour** | Log state transition failures; allow manual status override |

### R11. Resume Interrupted Extractions

| Attribute | Detail |
|---|---|
| **Purpose** | Resume extraction from point of failure when resumeFromFailure is enabled |
| **Input** | Failed product URLs, resume configuration |
| **Output** | Resumed extraction results |
| **Dependencies** | extracted_products table (failure_reason, retry_count fields) |
| **Failure Behaviour** | Skip products that cannot be resumed; log skip reason |

### R12. Coordinate Concurrency

| Attribute | Detail |
|---|---|
| **Purpose** | Manage parallel extraction across multiple product URLs |
| **Input** | URL list, concurrency limit |
| **Output** | Coordinated extraction results |
| **Dependencies** | detail-extraction-engine.ts concurrency controls |
| **Failure Behaviour** | Throttle on rate-limit errors; log concurrency violations |

### R13. Report Extraction Status

| Attribute | Detail |
|---|---|
| **Purpose** | Return structured extraction status to Layer 2 for workflow progression |
| **Input** | Extraction session results |
| **Output** | ExtractionStatusResponse with coverage, recovery stats, quality metrics |
| **Dependencies** | GET /api/detail-extraction response format |
| **Failure Behaviour** | Return partial status if some metrics unavailable |

---

## Inputs

| Input | Source | Description |
|---|---|---|
| Target URL | Layer 2 | Website URL to extract products from |
| Extraction Options | Layer 2 | concurrency, maxRetries, resumeFromFailure, useRecovery |
| Product URLs | Discovery Engine | List of product URLs to extract details from |
| HTML Content | Engine Output | Raw HTML from Chrome DevTools MCP / JCodesMore / Firecrawl |
| Retry Policy | policies/retry-policy.json | Retry rules for extraction engines |

## Outputs

| Output | Destination | Description |
|---|---|---|
| Extracted Products | SQLite (extracted_products) | Structured product data with all fields |
| Media Assets | SQLite (media_assets) | Images, videos, downloads per product |
| Extraction Metrics | SQLite (extraction_metrics) | Performance data per extraction attempt |
| Quality Reports | quality-validator.ts | Extraction quality assessment |
| Status Response | Layer 2 (API) | Extraction status for workflow progression |
| Recovery Dashboard | Dashboard (/extraction-recovery) | Visual recovery metrics display |

---

## Data Flow

```
Layer 2 (OpenCode)
    │
    ├─ POST /api/detail-extraction { url, useRecovery: true }
    │
    ▼
Extraction Manager (R1)
    │
    ├─ Try Chrome DevTools MCP (Primary)
    │   └─ Success? → Normalize (R6) → Validate (R7) → Store (R10) → Report (R9)
    │   └─ Failure? → Detect (R3) → Retry (R4) → Switch (R5)
    │
    ├─ Try JCodesMore Browser (Recovery L1)
    │   └─ Success? → Normalize (R6) → Validate (R7) → Store (R10) → Report (R9)
    │   └─ Failure? → Detect (R3) → Retry (R4) → Switch (R5)
    │
    ├─ Try Firecrawl (Recovery L2)
    │   └─ Success? → Normalize (R6) → Validate (R7) → Store (R10) → Report (R9)
    │   └─ Failure? → Detect (R3) → Record terminal failure → Skip product
    │
    └─ Return ExtractionStatusResponse to Layer 2
```

---

## Policy Usage

| Policy | Used By | Enforcement |
|---|---|---|
| Retry Policy (extractionEngines) | R4 Retry Failed Extractions | maxAttempts: 2, delayMs: 2000, backoffMultiplier: 2 |
| Build Gate | Not used by Layer 3 | Layer 2 responsibility |
| Architecture Lock | R5 Recovery Switching | Engine priority chain is FIXED |

---

## Recovery Capability

| Scenario | Behaviour |
|---|---|
| Chrome DevTools MCP timeout | Retry once, then switch to JCodesMore (Recovery L1) |
| JCodesMore fetch failure | Retry once, then switch to Firecrawl (Recovery L2) |
| Firecrawl API error | Retry once, then record terminal failure |
| All engines fail | Record failure reason, mark product as failed, continue to next product |
| Rate limiting (429) | Apply exponential backoff per retry policy |
| Network error (ECONNRESET) | Retry with backoff per retry policy |

---

## Reports

| Report Type | Source | Destination |
|---|---|---|
| Extraction Summary | GET /api/detail-extraction | Layer 2, Dashboard |
| Recovery Metrics | getExtractionMetricsSummary() | Dashboard (/extraction-recovery) |
| Quality Report | validateExtractionQuality() | GET /api/detail-extraction response |
| Engine Health | ExtractionMetrics aggregation | Monitoring (manual) |

---

## Implementation Files

| File | Purpose |
|---|---|
| `src/discovery/extraction/extraction-manager.ts` | Core extraction manager — coordinates engines with fallback |
| `src/discovery/extraction/jcodesmore-engine.ts` | Recovery Level 1 — browser-like headers fetch |
| `src/discovery/extraction/firecrawl-engine.ts` | Recovery Level 2 — Firecrawl API or fallback parser |
| `src/discovery/extraction/index.ts` | Barrel export for extraction module |
| `src/discovery/extraction-with-recovery.ts` | RecoveryExtractionEngine — wraps pipeline with multi-engine fallback |
| `src/discovery/detail-extraction-engine.ts` | DetailExtractionEngine — orchestrates per-product extraction |
| `src/discovery/dom-extractor.ts` | DOM data extraction (title, description, images, specs, SEO, schema, FAQ) |
| `src/discovery/media-extractor.ts` | Media asset extraction |
| `src/discovery/gemini-analyzer.ts` | Heuristic normalization (not API call) |
| `src/discovery/quality-validator.ts` | Extraction quality validation |
| `src/types/discovery.ts` | All extraction type definitions |
| `src/app/api/detail-extraction/route.ts` | API route for extraction operations |
| `src/app/dashboard/extraction-recovery/page.tsx` | Dashboard page for recovery metrics |
| `policies/retry-policy.json` | Retry rules for extraction engines |
