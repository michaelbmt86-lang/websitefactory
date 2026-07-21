# Layer 4 — Browser Metrics Framework

## Overview

The Browser Metrics Framework defines metrics tracking for the Layer 4 Browser Extraction Layer. It tracks 12 browser-level metrics, manages retention, performs aggregation, and reports metrics to Layer 3.

---

## Tracked Metrics

### Navigation Metrics

| Metric | Unit | Description |
|---|---|---|
| `navigationTime` | ms | Time to navigate to URL |
| `domReadyTime` | ms | Time for DOM to be ready after navigation |
| `networkIdleTime` | ms | Time until network becomes idle |

### Content Metrics

| Metric | Unit | Description |
|---|---|---|
| `assetCount` | count | Number of assets discovered on page |
| `domSize` | mixed | DOM size (elements, depth, HTML bytes) |
| `screenshotCount` | count | Number of screenshots taken |

### Performance Metrics

| Metric | Unit | Description |
|---|---|---|
| `requestCount` | count | Number of HTTP requests made |
| `responseCount` | count | Number of HTTP responses received |
| `browserLifetime` | ms | Total browser session lifetime |
| `memoryUsage` | bytes | Browser memory usage |

### Reliability Metrics

| Metric | Unit | Description |
|---|---|---|
| `retryCount` | count | Number of retries per extraction |
| `recoveryCount` | count | Number of recovery events per extraction |

---

## Per-Engine Metrics

Each metric is tracked per engine:

| Engine | Navigation | Capture | Assets | Performance | Reliability |
|---|---|---|---|---|---|
| Chrome DevTools MCP | ✅ | ✅ | ✅ | ✅ | ✅ |
| JCodesMore Browser | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firecrawl | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Metric Aggregation

### Aggregation Windows

| Window | Description |
|---|---|
| `last10` | Last 10 measurements |
| `last50` | Last 50 measurements |
| `last100` | Last 100 measurements |
| `overall` | All measurements |

### Aggregation Functions

| Function | Applied To |
|---|---|
| `avg` | All metrics |
| `min` | Duration, count metrics |
| `max` | Duration, count metrics |
| `p95` | Duration metrics |
| `p99` | Navigation, DOM ready time |
| `total` | Count metrics |

---

## Metric Retention

| Rule | Value | Description |
|---|---|---|
| `maxRecordsPerEngine` | 1000 | Maximum records per engine |
| `maxRecordsOverall` | 5000 | Maximum records overall |
| `retentionDays` | 30 | Days to retain records |
| `compressOldRecords` | true | Compress records older than archive threshold |
| `archiveAfterDays` | 7 | Days before archiving |

---

## Metric Reporting

| Report | Format | Destination |
|---|---|---|
| Engine Breakdown | JSON | Layer 3 |
| Overall Summary | JSON | Layer 3 |
| Per-URL Metrics | JSON | Layer 3 |
| Timestamps | ISO 8601 | Included in all reports |

---

## Metric Definitions

### Navigation Time

- **Description:** Time to navigate to URL
- **Unit:** ms
- **Aggregation:** avg, min, max, p95, p99
- **Per-Engine:** Yes
- **Per-URL:** No

### DOM Ready Time

- **Description:** Time for DOM to be ready after navigation
- **Unit:** ms
- **Aggregation:** avg, min, max, p95, p99
- **Per-Engine:** Yes
- **Per-URL:** No

### Network Idle Time

- **Description:** Time until network becomes idle
- **Unit:** ms
- **Aggregation:** avg, min, max, p95
- **Per-Engine:** Yes
- **Per-URL:** No

### Asset Count

- **Description:** Number of assets discovered on page
- **Unit:** count
- **Aggregation:** avg, min, max
- **Per-Engine:** Yes
- **Per-URL:** Yes

### Request Count

- **Description:** Number of HTTP requests made
- **Unit:** count
- **Aggregation:** avg, min, max
- **Per-Engine:** Yes
- **Per-URL:** No

### Response Count

- **Description:** Number of HTTP responses received
- **Unit:** count
- **Aggregation:** avg, min, max
- **Per-Engine:** Yes
- **Per-URL:** No

### Retry Count

- **Description:** Number of retries per extraction
- **Unit:** count
- **Aggregation:** avg, total
- **Per-Engine:** Yes
- **Per-URL:** No

### Recovery Count

- **Description:** Number of recovery events per extraction
- **Unit:** count
- **Aggregation:** avg, total
- **Per-Engine:** Yes
- **Per-URL:** No

### Browser Lifetime

- **Description:** Total browser session lifetime
- **Unit:** ms
- **Aggregation:** avg, min, max
- **Per-Engine:** Yes
- **Per-URL:** No

### Memory Usage

- **Description:** Browser memory usage
- **Unit:** bytes
- **Aggregation:** avg, max
- **Per-Engine:** Yes
- **Per-URL:** No

### Screenshot Count

- **Description:** Number of screenshots taken
- **Unit:** count
- **Aggregation:** total, avg
- **Per-Engine:** Yes
- **Per-URL:** No

### DOM Size

- **Description:** DOM size in elements and bytes
- **Unit:** mixed
- **Aggregation:** avg, max
- **Per-Engine:** Yes
- **Per-URL:** Yes
- **Sub-Metrics:** elements, depth, htmlSizeBytes

---

## Infrastructure Files

| File | Purpose |
|---|---|
| `src/discovery/browser/browser-metrics.ts` | Metrics types and definitions |
| `policies/browser-metrics-policy.json` | Metrics behaviour rules |
| `runtime/browser-metrics.json` | Metrics runtime metadata |
