# Layer 4 — Browser Health Framework

## Overview

The Browser Health Framework defines health monitoring for the Layer 4 Browser Extraction Layer. It tracks browser session health, calculates health scores, detects health degradation, and reports health status to Layer 3.

---

## Health States

| State | Description | Severity |
|---|---|---|
| **Healthy** | Browser is operating normally | Low |
| **Warning** | Browser is experiencing degraded performance | Medium |
| **Busy** | Browser is processing requests | Low |
| **Recovering** | Browser is recovering from failure | Medium |
| **Failed** | Browser has failed and is not operational | High |
| **Offline** | Browser is offline or unreachable | Critical |
| **Recovery Complete** | Browser has recovered from failure | Low |
| **Unknown** | Browser health is unknown | None |

---

## Health State Thresholds

### Healthy

| Metric | Threshold |
|---|---|
| Success Rate | ≥ 90% |
| Avg Duration | ≤ 30s |
| Consecutive Failures | ≤ 2 |
| Error Rate | ≤ 10% |

### Warning

| Metric | Threshold |
|---|---|
| Success Rate | ≥ 70% |
| Avg Duration | ≤ 60s |
| Consecutive Failures | ≤ 5 |
| Error Rate | ≤ 30% |

### Busy

| Metric | Threshold |
|---|---|
| Success Rate | ≥ 50% |
| Avg Duration | ≤ 120s |
| Consecutive Failures | ≤ 10 |
| Error Rate | ≤ 50% |

### Recovering

| Metric | Threshold |
|---|---|
| Success Rate | ≥ 0% |
| Avg Duration | ≤ 300s |
| Consecutive Failures | ≤ 15 |
| Error Rate | ≤ 100% |

### Failed

| Metric | Threshold |
|---|---|
| Success Rate | Any |
| Avg Duration | Any |
| Consecutive Failures | Any |
| Error Rate | Any |

### Recovery Complete

| Metric | Threshold |
|---|---|
| Success Rate | ≥ 80% |
| Avg Duration | ≤ 30s |
| Consecutive Failures | 0 |
| Error Rate | ≤ 20% |

---

## Health Score Calculation

### Weights

| Factor | Weight |
|---|---|
| Success Rate | 40% |
| Avg Duration | 20% |
| Error Rate | 20% |
| Consecutive Failures | 20% |

### Score Range

| Range | State |
|---|---|
| 80–100 | Healthy |
| 50–79 | Warning |
| 20–49 | Failed |
| 0–19 | Failed (critical) |

### Calculation Formula

```
healthScore = (successRateScore × 0.4) +
              (durationScore × 0.2) +
              (errorRateScore × 0.2) +
              (consecutiveFailureScore × 0.2)
```

Where each factor is normalized to 0–100.

---

## Health Trend

| Direction | Description |
|---|---|
| **Improving** | Health score increasing over time |
| **Stable** | Health score unchanged |
| **Degrading** | Health score decreasing over time |

### Trend Calculation

- Window size: 50 measurements
- Change threshold: 5%
- Direction determined by comparing recent window to previous window

---

## Health Check Schedule

| Check | Trigger | Description |
|---|---|---|
| `checkOnExtraction` | After each extraction | Update health metrics |
| `checkOnFailure` | On extraction failure | Recalculate health score |
| `checkOnRecovery` | On recovery attempt | Update health state |
| `intervalMs` | Every 5 minutes | Periodic health check |

---

## Health Alerts

| Alert | Trigger |
|---|---|
| State Change | Health state changes |
| Degradation | Health score drops below threshold |
| Recovery | Health recovers from failed/warning |
| Consecutive Failures | Consecutive failures exceed threshold (3) |

---

## Per-Engine Health Metrics

| Metric | Description |
|---|---|
| `successRate` | Percentage of successful extractions |
| `failureRate` | Percentage of failed extractions |
| `avgDurationMs` | Average extraction duration |
| `p95DurationMs` | 95th percentile extraction duration |
| `totalAttempts` | Total extraction attempts |
| `totalSuccesses` | Total successful extractions |
| `totalFailures` | Total failed extractions |
| `timeoutCount` | Number of timeout failures |
| `networkErrorCount` | Number of network errors |
| `parseErrorCount` | Number of parsing errors |
| `sessionCrashCount` | Number of session crashes |
| `unknownErrorCount` | Number of unknown errors |

---

## Infrastructure Files

| File | Purpose |
|---|---|
| `src/discovery/browser/browser-health.ts` | Health types and state definitions |
| `policies/browser-health-policy.json` | Health behaviour rules |
| `runtime/browser-health.json` | Health runtime metadata |
