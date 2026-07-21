# Layer 4 — Policy Reference

## Overview

Layer 4 Browser Policies define behaviour rules for browser extraction, session management, timeout handling, retry logic, health monitoring, and metrics tracking. Policies describe **what** should happen — they do not contain executable logic.

---

## Policy Registry

| Policy | File | Owner | Version |
|---|---|---|---|
| Browser Policy | `policies/browser-policy.json` | Layer 4 | 1.0.0 |
| Browser Session Policy | `policies/browser-session-policy.json` | Layer 4 | 1.0.0 |
| Browser Timeout Policy | `policies/browser-timeout-policy.json` | Layer 4 | 1.0.0 |
| Browser Retry Policy | `policies/browser-retry-policy.json` | Layer 4 | 1.0.0 |
| Browser Health Policy | `policies/browser-health-policy.json` | Layer 4 | 1.0.0 |
| Browser Metrics Policy | `policies/browser-metrics-policy.json` | Layer 4 | 1.0.0 |

---

## Browser Policy

Defines browser extraction behaviour: engine execution, session management, content capture, dynamic rendering, and asset discovery.

### Key Rules

| Rule | Description |
|---|---|
| `engineExecution` | Layer 4 executes the engine that Layer 3 specifies. Engine selection is Layer 3 responsibility. |
| `firecrawlNeverPrimary` | Firecrawl must NEVER become primary. Engine priority is FIXED. |
| `sessionManagement` | Sessions have lifecycle states: created → active → busy → idle → closed. |
| `contentCapture` | Minimum content length: 100 bytes. Validation required. |
| `dynamicRendering` | Expand hidden content, lazy-loaded elements, accordions, tabs. Fallback to original on failure. |
| `assetDiscovery` | Discover images, videos, downloads, JSON-LD, noscript, meta tags. Normalize URLs. |

---

## Browser Session Policy

Defines browser session lifecycle: creation, activation, idle timeout, cleanup, and recovery.

### Key Rules

| Rule | Description |
|---|---|
| `sessionCreation` | Require engine name. Default timeout: 60s. Max sessions per engine: 1. Total max: 3. |
| `sessionLifecycle` | Allowed state transitions defined. Auto-close on idle (30s). Auto-close on failure. |
| `sessionCleanup` | Cleanup on completion and failure. Force cleanup after 120s. Release memory and connections. |
| `sessionRecovery` | No auto-recovery. Max 1 recovery attempt. Report recovery to Layer 3. |

---

## Browser Timeout Policy

Defines timeout behaviour: navigation, capture, session, idle, and overall extraction timeouts.

### Timeout Values

| Timeout | Default | Per-Engine Override |
|---|---|---|
| Navigation | 30s | Chrome: 60s, JCodesMore: 30s, Firecrawl: 45s |
| Capture | 15s | Chrome: 30s, JCodesMore: 15s, Firecrawl: 20s |
| Session | 120s | — |
| Idle | 30s | — |
| Overall Extraction | 180s | — |

### Key Rules

| Rule | Description |
|---|---|
| `abortOnTimeout` | Abort navigation/capture on timeout. |
| `forceCloseOnTimeout` | Force-close session on timeout. |
| `abortAllOnTimeout` | Abort all engines on overall extraction timeout. |

---

## Browser Retry Policy

Defines retry behaviour: navigation retry, capture retry, session retry, and overall retry budget.

### Retry Values

| Retry | Max Attempts | Delay | Backoff | Max Delay |
|---|---|---|---|---|
| Navigation | 2 | 2000ms | 2x | 16000ms |
| Capture | 2 | 1000ms | 2x | 8000ms |
| Session | 1 | 3000ms | 1x | 3000ms |
| Overall | 6 total | — | — | — |

### Key Rules

| Rule | Description |
|---|---|
| `retryableErrors` | ECONNRESET, ETIMEDOUT, ENOTFOUND, ECONNREFUSED, 5xx |
| `nonRetryableErrors` | 404, 403, 401 |
| `maxRetriesPerEngine` | 2 per engine |
| `resetBudgetOnSuccess` | Reset retry count on successful extraction |

---

## Browser Health Policy

Defines health monitoring: health states, scoring, thresholds, and health check intervals.

### Health States

| State | Min Success Rate | Max Avg Duration | Max Consecutive Failures |
|---|---|---|---|
| `healthy` | 90% | 30s | 2 |
| `warning` | 70% | 60s | 5 |
| `busy` | 50% | 120s | 10 |
| `recovering` | 0% | 300s | 15 |
| `failed` | 0% | ∞ | ∞ |
| `offline` | 0% | ∞ | ∞ |
| `recovery-complete` | 80% | 30s | 0 |

### Health Score Weights

| Weight | Factor | Value |
|---|---|---|
| Success Rate | 40% | 0.4 |
| Avg Duration | 20% | 0.2 |
| Error Rate | 20% | 0.2 |
| Consecutive Failures | 20% | 0.2 |

### Health Score Thresholds

| Threshold | Score |
|---|---|
| Healthy | ≥ 80 |
| Warning | ≥ 50 |
| Failed | < 20 |

---

## Browser Metrics Policy

Defines metrics tracking: 12 browser-level metrics, retention, aggregation, and reporting.

### Tracked Metrics

| Metric | Unit | Per-Engine | Per-URL |
|---|---|---|---|
| `navigationTime` | ms | Yes | No |
| `domReadyTime` | ms | Yes | No |
| `networkIdleTime` | ms | Yes | No |
| `assetCount` | count | Yes | Yes |
| `requestCount` | count | Yes | No |
| `responseCount` | count | Yes | No |
| `retryCount` | count | Yes | No |
| `recoveryCount` | count | Yes | No |
| `browserLifetime` | ms | Yes | No |
| `memoryUsage` | bytes | Yes | No |
| `screenshotCount` | count | Yes | No |
| `domSize` | mixed | Yes | Yes |

### Retention Rules

| Rule | Value |
|---|---|
| Max records per engine | 1000 |
| Max records overall | 5000 |
| Retention days | 30 |
| Archive after days | 7 |

---

## Policy Enforcement

| Policy | Enforced By | Layer |
|---|---|---|
| Browser Policy | Browser infrastructure modules | Layer 4 |
| Session Policy | `browser-session.ts` | Layer 4 |
| Timeout Policy | Engine fetch calls (AbortController) | Layer 4 |
| Retry Policy | Layer 3 (extraction-manager.ts) | Layer 3 |
| Health Policy | `browser-health.ts` | Layer 4 |
| Metrics Policy | `browser-metrics.ts` | Layer 4 |
