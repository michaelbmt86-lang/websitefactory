# Layer 3 — Runtime Documentation

**Date:** 2026-07-18
**Scope:** Runtime metadata and operational state for the Layer 3 Extraction Manager

---

## Runtime Files

### Engine Status (`runtime/engine-status.json`)

| File | Purpose | Updated By |
|---|---|---|
| `engine-status.json` | Current state of each extraction engine | Layer 3 Extraction Manager |

**Contents:**
- Engine health states (alive, busy, failed, disabled, timeout)
- Last health check timestamps
- Last successful/failed extraction timestamps
- Consecutive failure counts
- Active request counts
- Queue depths
- Current recovery operations

### Engine Health (`runtime/engine-health.json`)

| File | Purpose | Updated By |
|---|---|---|
| `engine-health.json` | Health metrics and trends per engine | Layer 3 Extraction Manager |

**Contents:**
- Success/failure rates (overall, last 10, last 50, last 100)
- Average durations (overall, successful, failed)
- Percentile durations (p95, p99)
- Error distributions (timeout, rate-limit, network, parse, unknown)
- Health trends (direction, change percent, window size)
- Health check schedules

### Engine Metrics (`runtime/engine-metrics.json`)

| File | Purpose | Updated By |
|---|---|---|
| `engine-metrics.json` | Comprehensive metrics per engine | Layer 3 Extraction Manager |

**Contents:**
- Extraction time metrics (total, avg, min, max, p95, p99)
- Retry count metrics (total, avg per extraction)
- Recovery count metrics (triggered as primary, L1, L2)
- Fallback count metrics (fallback from, fallback to)
- Success/failure rate metrics (overall, last 10, last 50, last 100)
- Average duration metrics (overall, successful, failed)
- DOM size metrics (avg elements, avg depth, avg HTML size)
- Media count metrics (avg images, avg videos, avg downloads)
- Product count metrics (total extracted, successful, failed)
- SQLite write metrics (total writes, avg writes per extraction)

### Engine History (`runtime/engine-history.json`)

| File | Purpose | Updated By |
|---|---|---|
| `engine-history.json` | Recent extraction attempts, recoveries, and failures | Layer 3 Extraction Manager |

**Contents:**
- Recent extractions (max 100 records)
- Recent recoveries (max 50 records)
- Recent failures (max 50 records)
- Record schemas for extractions, recoveries, and failures

---

## Runtime Lifecycle

### Startup

1. Load runtime files from `runtime/` directory
2. Initialize engine status to "unknown"
3. Set health metrics to zero
4. Clear history arrays
5. Wait for first extraction or health check

### During Extraction

1. Update engine status to "busy" when extraction starts
2. Record extraction metrics (duration, success, retry count)
3. Update engine health (success rate, avg duration)
4. Append extraction record to history
5. Update engine status to "alive" or "failed" based on result

### During Recovery

1. Record recovery event (from-engine, to-engine, reason, success)
2. Update engine health for both engines
3. Append recovery record to history
4. Update engine status based on recovery result

### Health Check

1. Calculate health metrics from recent extraction history
2. Update engine health state based on indicators
3. Apply auto-disable if consecutive failures exceed threshold
4. Apply auto-reenable if cooldown period elapsed
5. Log health state changes

### Shutdown

1. Save runtime files to `runtime/` directory
2. Persist engine status, health, metrics, and history
3. Log final state for debugging

---

## Runtime Constraints

| Constraint | Value | Notes |
|---|---|---|
| **No Execution Logic** | Runtime files are metadata only | They describe state, they do not execute behaviour |
| **Additive Only** | Runtime files can be added, not modified | Existing files are read-only during upgrades |
| **No Schema Changes** | Runtime files do not affect SQLite schema | They are separate from database records |
| **No API Changes** | Runtime files do not affect API endpoints | They are consumed internally by Layer 3 |

---

## Runtime Integration

| Component | Integration | Notes |
|---|---|---|
| **Layer 2 (OpenCode)** | Indirect via API | Layer 2 does not directly read runtime files |
| **Layer 3 (Extraction Manager)** | Direct read/write | Primary consumer and producer of runtime data |
| **Dashboard** | Indirect via API | Dashboard reads metrics via GET /api/detail-extraction |
| **SQLite** | Separate storage | Runtime files are JSON, not database records |

---

## Runtime File Schema

### Engine Status Record

```json
{
  "name": "string — engine name",
  "displayName": "string — human-readable name",
  "status": "unknown|alive|busy|failed|disabled|timeout",
  "lastHealthCheck": "ISO 8601 | null",
  "lastSuccessfulExtraction": "ISO 8601 | null",
  "lastFailedExtraction": "ISO 8601 | null",
  "consecutiveFailures": "number",
  "activeRequests": "number",
  "queueDepth": "number",
  "currentRecovery": "string | null"
}
```

### Engine Health Record

```json
{
  "name": "string — engine name",
  "displayName": "string — human-readable name",
  "healthState": "unknown|alive|busy|failed|disabled|timeout",
  "metrics": {
    "successRate": "number | null",
    "failureRate": "number | null",
    "avgDurationMs": "number | null",
    "p95DurationMs": "number | null",
    "p99DurationMs": "number | null",
    "totalAttempts": "number",
    "totalSuccesses": "number",
    "totalFailures": "number",
    "timeoutCount": "number",
    "rateLimitCount": "number",
    "networkErrorCount": "number",
    "parseErrorCount": "number",
    "unknownErrorCount": "number"
  },
  "trend": {
    "direction": "improving|stable|degrading",
    "changePercent": "number",
    "windowSize": "number"
  },
  "lastHealthCheck": "ISO 8601 | null",
  "nextHealthCheck": "ISO 8601 | null"
}
```

### Extraction Record

```json
{
  "id": "string — unique extraction ID",
  "url": "string — target URL",
  "engine": "string — engine used",
  "status": "success|failed|timeout|rate-limited",
  "durationMs": "number — extraction duration",
  "retryCount": "number — retries attempted",
  "recoveryLevel": "primary|recovery-l1|recovery-l2",
  "failureReason": "string | null",
  "timestamp": "ISO 8601"
}
```

### Recovery Record

```json
{
  "id": "string — unique recovery ID",
  "url": "string — target URL",
  "fromEngine": "string — engine that failed",
  "toEngine": "string — engine switched to",
  "reason": "string — recovery trigger reason",
  "success": "boolean — recovery succeeded",
  "durationMs": "number — recovery duration",
  "timestamp": "ISO 8601"
}
```

### Failure Record

```json
{
  "id": "string — unique failure ID",
  "url": "string — target URL",
  "engine": "string — engine that failed",
  "category": "network|timeout|parsing|rate-limit|unknown",
  "error": "string — error message",
  "allEnginesFailed": "boolean — all engines failed",
  "productSkipped": "boolean — product was skipped",
  "timestamp": "ISO 8601"
}
```
