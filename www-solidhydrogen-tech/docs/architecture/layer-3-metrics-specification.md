# Layer 3 — Engine Metrics Specification

**Date:** 2026-07-18
**Scope:** Metrics tracking specification for the Layer 3 Extraction Manager

---

## Metrics Categories

### Extraction Time

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **totalMs** | Total extraction time across all attempts | milliseconds | sum |
| **avgMs** | Average extraction time per attempt | milliseconds | average |
| **minMs** | Minimum extraction time | milliseconds | min |
| **maxMs** | Maximum extraction time | milliseconds | max |
| **p95Ms** | 95th percentile extraction time | milliseconds | percentile |
| **p99Ms** | 99th percentile extraction time | milliseconds | percentile |

### Retry Count

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **total** | Total number of retries across all extractions | count | sum |
| **avgPerExtraction** | Average retries per extraction attempt | count | average |

### Recovery Count

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **triggeredAsPrimary** | Times engine was triggered as primary | count | sum |
| **triggeredAsRecoveryL1** | Times engine was triggered as Recovery Level 1 | count | sum |
| **triggeredAsRecoveryL2** | Times engine was triggered as Recovery Level 2 | count | sum |

### Fallback Count

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **fallbackFrom** | Times engine was fallen back from | count | sum |
| **fallbackTo** | Times engine was fallen back to | count | sum |

### Success Rate

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **overall** | Overall success rate across all attempts | percent | average |
| **last10** | Success rate for last 10 attempts | percent | rolling window |
| **last50** | Success rate for last 50 attempts | percent | rolling window |
| **last100** | Success rate for last 100 attempts | percent | rolling window |

### Failure Rate

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **overall** | Overall failure rate across all attempts | percent | average |
| **last10** | Failure rate for last 10 attempts | percent | rolling window |
| **last50** | Failure rate for last 50 attempts | percent | rolling window |
| **last100** | Failure rate for last 100 attempts | percent | rolling window |

### Average Duration

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **overall** | Average duration across all attempts | milliseconds | average |
| **successful** | Average duration for successful extractions | milliseconds | average |
| **failed** | Average duration for failed extractions | milliseconds | average |

### DOM Size

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **avgElements** | Average number of DOM elements extracted | count | average |
| **avgDepth** | Average DOM tree depth | count | average |
| **avgHtmlSizeBytes** | Average HTML size in bytes | bytes | average |

### Media Count

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **avgImages** | Average number of images extracted | count | average |
| **avgVideos** | Average number of videos extracted | count | average |
| **avgDownloads** | Average number of downloads extracted | count | average |

### Product Count

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **totalExtracted** | Total products extracted | count | sum |
| **successfulExtractions** | Products successfully extracted | count | sum |
| **failedExtractions** | Products failed to extract | count | sum |

### SQLite Writes

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **totalWrites** | Total SQLite write operations | count | sum |
| **avgWritesPerExtraction** | Average SQLite writes per extraction | count | average |

---

## Overall Metrics

| Metric | Description | Unit | Aggregation |
|---|---|---|---|
| **totalExtractions** | Total extraction attempts across all engines | count | sum |
| **totalSuccesses** | Total successful extractions | count | sum |
| **totalFailures** | Total failed extractions | count | sum |
| **overallSuccessRate** | Overall success rate across all engines | percent | average |
| **overallAvgDurationMs** | Overall average extraction duration | milliseconds | average |
| **totalRecoveryAttempts** | Total recovery attempts | count | sum |
| **totalFallbacks** | Total fallback switches | count | sum |
| **totalRetries** | Total retries across all engines | count | sum |

---

## Metrics Storage

| Storage | Location | Format |
|---|---|---|
| **SQLite** | `extraction_metrics` table | Structured records per extraction attempt |
| **Runtime JSON** | `runtime/engine-metrics.json` | Aggregated metrics per engine |
| **Dashboard** | `/api/detail-extraction` | API response with metrics summary |

---

## Metrics Collection Points

| Collection Point | Metrics Collected | Frequency |
|---|---|---|
| **Extraction Attempt** | duration, success, retry count, engine | Per attempt |
| **Recovery Switch** | from-engine, to-engine, reason | Per recovery |
| **Quality Validation** | quality scores, issues | Per product |
| **Engine Health Check** | success rate, avg duration, error distribution | Every 5 minutes |
| **Session Completion** | total products, coverage, recovery stats | Per session |

---

## Metrics Reset Policy

| Policy | Value | Notes |
|---|---|---|
| **Reset on Restart** | false | Metrics persist across restarts |
| **Reset on Manual Trigger** | true | Can be manually reset via API |
| **Maximum History** | 10000 records | Oldest records pruned when exceeded |
| **Aggregation Window** | Rolling 100 attempts | For success/failure rate calculations |
