# Layer 3 — Policy Reference

**Date:** 2026-07-18
**Scope:** Complete policy reference for the Layer 3 Extraction Manager

---

## Policy Files

| Policy | File | Version | Owner |
|---|---|---|---|
| Extraction Policy | `policies/extraction-policy.json` | 1.0.0 | layer-3-extraction-manager |
| Engine Priority | `policies/engine-priority.json` | 1.0.0 | layer-3-extraction-manager |
| Quality Policy | `policies/quality-policy.json` | 1.0.0 | layer-3-extraction-manager |
| Concurrency Policy | `policies/concurrency-policy.json` | 1.0.0 | layer-3-extraction-manager |
| Timeout Policy | `policies/timeout-policy.json` | 1.0.0 | layer-3-extraction-manager |
| Health Policy | `policies/health-policy.json` | 1.0.0 | layer-3-extraction-manager |
| Retry Policy | `policies/retry-policy.json` | 1.0.0 | layer-2-execution-engine |

---

## Extraction Policy

### Engine Selection Rules

| Rule | Value | Notes |
|---|---|---|
| **Priority Chain** | chrome-devtools-mcp → jcodesmore-browser → firecrawl | Fixed, cannot be reordered |
| **Fallback Enabled** | true | Fall back to next engine on failure |
| **Max Engines Per Attempt** | 3 | Try all three engines before terminal failure |
| **Firecrawl Never Primary** | true | Critical constraint — Firecrawl must NEVER be primary |

### Retry Rules

| Rule | Value | Notes |
|---|---|---|
| **Max Attempts** | 2 | Retry once before falling back |
| **Delay** | 2000ms | Initial retry delay |
| **Backoff Multiplier** | 2 | Exponential backoff |
| **Max Delay** | 30000ms | Cap on backoff delay |
| **Retryable Errors** | ECONNRESET, ETIMEDOUT, 429, 500, 502, 503, 504 | Network and server errors |
| **Strategy** | retry-same-engine-then-fallback | Retry same engine, then fallback |

### Recovery Rules

| Rule | Value | Notes |
|---|---|---|
| **Recovery Enabled** | true | Enable recovery switching |
| **Primary Failure Action** | retry-then-fallback | Retry Chrome DevTools, then fallback to JCodesMore |
| **Recovery L1 Failure Action** | retry-then-fallback | Retry JCodesMore, then fallback to Firecrawl |
| **Recovery L2 Failure Action** | retry-then-terminal-failure | Retry Firecrawl, then terminal failure |
| **Terminal Failure Action** | record-failure-skip-product | Record failure and skip product |

### Normalization Rules

| Rule | Value | Notes |
|---|---|---|
| **Strategy** | dom-extraction-plus-heuristic | Use DOM extraction and heuristic normalization |
| **Fallback to Partial** | true | Allow partial extraction if normalization fails |
| **Log Missing Fields** | true | Log fields that could not be extracted |

### State Management Rules

| Rule | Value | Notes |
|---|---|---|
| **Allowed Transitions** | pending→extracting/failed, extracting→completed/failed/retrying, retrying→extracting/failed, failed→retrying/pending | Define valid state transitions |
| **Terminal States** | completed, failed (when retries exhausted) | States with no outgoing transitions |

---

## Engine Priority Policy

### Engine Definitions

| Engine | Priority | Role | Retry Limit | Timeout | Failure Action |
|---|---|---|---|---|---|
| Chrome DevTools MCP | 1 | Primary | 2 | 60000ms | retry-then-fallback |
| JCodesMore Browser | 2 | Recovery L1 | 2 | 30000ms | retry-then-fallback |
| Firecrawl | 3 | Recovery L2 | 2 | 45000ms | retry-then-terminal-failure |

### Constraints

| Constraint | Value | Notes |
|---|---|---|
| **Never Promote Firecrawl** | true | Firecrawl must NEVER become primary |
| **Fixed Priority Chain** | true | Engine priority is FIXED and cannot be reordered |
| **Skip Engines** | false | Never skip engines in the priority chain |
| **Parallel Engines** | false | Engines are tried sequentially, not in parallel |

---

## Quality Policy

### Quality Dimensions

| Dimension | Weight | Minimum Threshold | Enforcement |
|---|---|---|---|
| DOM Completeness | 0.25 | 70% | Advisory |
| Asset Completeness | 0.20 | 60% | Advisory |
| Image Coverage | 0.20 | 50% | Advisory |
| SEO Completeness | 0.20 | 80% | Advisory |
| Schema Completeness | 0.15 | 50% | Advisory |

### Overall Score

| Rule | Value | Notes |
|---|---|---|
| **Calculation** | Weighted average of all dimensions | (DOM×0.25) + (Asset×0.20) + (Image×0.20) + (SEO×0.20) + (Schema×0.15) |
| **Minimum Threshold** | 65 | Overall quality score minimum |
| **Scale** | 0-100 | Score range |
| **Block Storage** | false | Low-quality extractions NOT blocked |
| **Log Issues** | true | Quality issues logged |
| **Include in Report** | true | Scores included in reports |

---

## Concurrency Policy

### Extraction Concurrency

| Rule | Value | Notes |
|---|---|---|
| **Default Concurrency** | 3 | Default parallel extractions |
| **Min Concurrency** | 1 | Minimum parallel extractions |
| **Max Concurrency** | 10 | Maximum parallel extractions |
| **Enforcement** | Hard | Strict concurrency limit |
| **Throttle on Rate Limit** | true | Throttle when rate limited |

### Per-Engine Concurrency

| Engine | Max Concurrent | Notes |
|---|---|---|
| Chrome DevTools MCP | 1 | Single-threaded browser session |
| JCodesMore Browser | 3 | HTTP client supports parallel requests |
| Firecrawl | 2 | API has rate limits |

### Rate Limiting

| Engine | Requests/Minute | Backoff | Backoff Duration |
|---|---|---|---|
| Chrome DevTools MCP | 30 | Yes | 5000ms |
| JCodesMore Browser | 60 | Yes | 2000ms |
| Firecrawl | 20 | Yes | 10000ms |

### Throttling

| Rule | Value | Notes |
|---|---|---|
| **Enabled** | true | Enable throttling |
| **Strategy** | Exponential backoff | Increase delay exponentially |
| **Initial Backoff** | 2000ms | Initial backoff delay |
| **Max Backoff** | 30000ms | Maximum backoff delay |
| **Backoff Multiplier** | 2 | Double delay each retry |

---

## Timeout Policy

### Per-URL Timeout

| Rule | Value | Notes |
|---|---|---|
| **Timeout** | 60000ms | Maximum time per URL extraction |
| **Enforcement** | Hard | Strict timeout |
| **Action** | abort-and-retry | Abort attempt, retry with next engine |

### Per-Engine Timeout

| Engine | Timeout | Notes |
|---|---|---|
| Chrome DevTools MCP | 60000ms | Browser automation may be slow |
| JCodesMore Browser | 30000ms | HTTP fetch should be faster |
| Firecrawl | 45000ms | API call with managed scraping |

### Overall Extraction Timeout

| Rule | Value | Notes |
|---|---|---|
| **Timeout** | 3600000ms (1 hour) | Maximum time for full site extraction |
| **Enforcement** | Soft | Log warning, continue extraction |
| **Action** | log-warning-continue | Log warning but continue |

### Timeout Actions

| Timeout Type | Action |
|---|---|
| Per-URL Timeout | Abort attempt, retry next engine |
| Per-Engine Timeout | Abort engine, fallback to next |
| Overall Timeout | Log warning, continue extraction |
| Retry Delay Timeout | Cap delay at maximum |

---

## Health Policy

### Engine States

| State | Description | Indicators | Transitions |
|---|---|---|---|
| **Alive** | Responsive, successful extractions | Success rate >80%, avg duration <2x baseline | busy, failed, disabled |
| **Busy** | Processing, may be slow | Success rate 50-80%, avg duration >2x baseline | alive, failed, disabled |
| **Failed** | Errors or timeouts | Success rate <50%, consecutive failures >3 | alive, disabled |
| **Disabled** | Manual or auto-disabled | Manual disable, auto-disable after 10 failures | alive |
| **Timeout** | Responding but slow | Avg duration >5x baseline, timeout errors increasing | alive, failed, disabled |

### Recovery States

| State | Description | Indicators |
|---|---|---|
| **Recovery Running** | Recovery engine active | Primary failed, fallback engine active |
| **Recovery Completed** | Recovery succeeded | Fallback success, product extracted |
| **Recovery Failed** | Recovery failed, terminal | All engines failed, product skipped |

### Health Monitoring

| Rule | Value | Notes |
|---|---|---|
| **Check Interval** | 300000ms (5 minutes) | How often to check health |
| **Window Size** | 50 | Recent attempts to consider |
| **Auto-Disable Threshold** | 10 | Consecutive failures before auto-disable |
| **Auto-Reenable After** | 1800000ms (30 minutes) | Time before auto-reenable |
| **Log Health Changes** | true | Log all state transitions |

---

## Retry Policy (Layer 2)

### Extraction Engines

| Rule | Value | Notes |
|---|---|---|
| **Max Attempts** | 2 | Retry once before fallback |
| **Delay** | 2000ms | Initial retry delay |
| **Backoff Multiplier** | 2 | Exponential backoff |
| **Fallback Chain** | chrome-devtools-mcp → jcodesmore-browser → firecrawl | Engine priority chain |
| **Note** | Try next engine before retrying same | Fallback before retry |

### API Calls

| Rule | Value | Notes |
|---|---|---|
| **Max Attempts** | 3 | Retry up to 3 times |
| **Delay** | 1000ms | Initial retry delay |
| **Backoff Multiplier** | 2 | Exponential backoff |
| **Max Delay** | 30000ms | Cap on backoff delay |
| **Retryable Errors** | ECONNRESET, ETIMEDOUT, 429, 500, 502, 503, 504 | Network and server errors |

---

## Policy Enforcement

| Policy | Enforcement | Notes |
|---|---|---|
| Extraction Policy | Hard | Engine selection and retry rules enforced |
| Engine Priority | Hard | Priority chain is fixed, cannot be reordered |
| Quality Policy | Advisory | Quality validation is advisory, not blocking |
| Concurrency Policy | Hard | Concurrency limits strictly enforced |
| Timeout Policy | Mixed | Per-URL/Engine hard, overall soft |
| Health Policy | Hard | Health states and transitions enforced |
| Retry Policy | Hard | Retry limits and backoff enforced |
