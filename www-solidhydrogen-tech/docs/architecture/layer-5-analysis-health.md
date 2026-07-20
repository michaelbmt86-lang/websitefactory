# Layer 5 — Analysis Health

## Overview

Analysis health monitoring tracks the operational health of each analysis module in the Layer 5 AI Analysis Layer. Health states, scores, trends, and error distributions are tracked per module.

---

## Health States

| State | Min Success Rate | Max Avg Duration | Max Consecutive Failures | Max Error Rate |
|---|---|---|---|---|
| `healthy` | >= 90% | <= 30s | <= 2 | <= 10% |
| `warning` | >= 70% | <= 60s | <= 5 | <= 30% |
| `busy` | >= 50% | <= 120s | <= 10 | <= 50% |
| `recovering` | >= 0% | <= 300s | <= 15 | <= 100% |
| `failed` | 0% | unlimited | unlimited | 100% |
| `offline` | 0% | unlimited | unlimited | 100% |
| `recovery-complete` | >= 80% | <= 30s | 0 | <= 20% |
| `unknown` | 0% | unlimited | unlimited | 100% |

---

## Health Score Calculation

### Weights

| Factor | Weight |
|---|---|
| Success Rate | 40% |
| Average Duration | 20% |
| Error Rate | 20% |
| Consecutive Failures | 20% |

### Score Thresholds

| Score Range | Health State |
|---|---|
| >= 80 | healthy |
| >= 50 | warning |
| < 50 | failed |

---

## Modules Monitored

| Module | Display Name | Health Metrics |
|---|---|---|
| `normalization` | HTML/CSS/Media Normalization | successRate, failureRate, avgDurationMs, p95DurationMs, htmlStripFailures, cssExtractionFailures, mediaNormalizationFailures, urlNormalizationFailures |
| `gemini-analyzer` | Gemini Heuristic Analyzer | successRate, failureRate, avgDurationMs, p95DurationMs, heuristicParseFailures, structuredDataFailures, normalizationFailures |
| `dom-extractor` | DOM Data Extractor | successRate, failureRate, avgDurationMs, p95DurationMs, titleExtractFailures, specExtractFailures, faqExtractFailures, structureExtractFailures |
| `seo-generator` | SEO Metadata Generator | successRate, failureRate, avgDurationMs, p95DurationMs, metaTagFailures, ogTagFailures, schemaFailures |
| `cms-generator` | CMS Content Generator | successRate, failureRate, avgDurationMs, p95DurationMs, pageGenerationFailures, brandGenerationFailures, collectionGenerationFailures, blogGenerationFailures |
| `quality-validator` | Quality Validator | successRate, failureRate, avgDurationMs, p95DurationMs, validationFailures, scoringFailures, reportGenerationFailures |

---

## Health Check Configuration

| Setting | Default | Description |
|---|---|---|
| `intervalMs` | 300000 (5 min) | Standard health check interval |
| `minIntervalMs` | 60000 (1 min) | Minimum interval between checks |
| `maxIntervalMs` | 600000 (10 min) | Maximum interval between checks |
| `checkOnAnalysis` | true | Check health after each analysis |
| `checkOnFailure` | true | Check health after each failure |
| `checkOnRecovery` | true | Check health after recovery |

---

## Health Trend

| Direction | Description |
|---|---|
| `improving` | Health score increasing over time |
| `stable` | Health score unchanged |
| `degrading` | Health score decreasing over time |

Trend is calculated over a configurable window (default: 50 recent analyses).

---

## TypeScript Interfaces

```typescript
type AnalysisHealthState =
  | "healthy" | "warning" | "busy" | "recovering"
  | "failed" | "offline" | "recovery-complete" | "unknown";

interface AnalysisHealthThresholds {
  minSuccessRate: number;
  maxAvgDurationMs: number;
  maxConsecutiveFailures: number;
  maxErrorRate: number;
}

interface ModuleHealthMetrics {
  successRate: number | null;
  failureRate: number | null;
  avgDurationMs: number | null;
  p95DurationMs: number | null;
  totalAttempts: number;
  totalSuccesses: number;
  totalFailures: number;
  timeoutCount: number;
  parseErrorCount: number;
  dataErrorCount: number;
  unknownErrorCount: number;
}

interface AnalysisHealthTrend {
  direction: "improving" | "stable" | "degrading";
  changePercent: number;
  windowSize: number;
}
```
