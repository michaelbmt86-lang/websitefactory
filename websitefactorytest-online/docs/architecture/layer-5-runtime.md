# Layer 5 — AI Analysis Layer Runtime

## Overview

Layer 5 runtime infrastructure defines the operational state, health monitoring, metrics collection, event tracking, and context management for the AI Analysis Layer. This runtime is purely declarative — type definitions and data structures only, no execution logic.

---

## Runtime Files

| File | Purpose |
|---|---|
| `runtime/analysis-status.json` | Current state of each analysis module, active analyses |
| `runtime/analysis-health.json` | Health states, scores, error distributions per module |
| `runtime/analysis-metrics.json` | Normalization/extraction/generation/validation metrics |
| `runtime/analysis-history.json` | Recent normalization, extraction, generation, and failure records |
| `runtime/analysis-context.json` | Active analysis sessions, configuration, state transitions |

---

## Module Status

| Module | Display Name | Role | Timeout |
|---|---|---|---|
| `normalization` | HTML/CSS/Media Normalization | Normalization | 30s |
| `gemini-analyzer` | Gemini Heuristic Analyzer | Analysis | 60s |
| `dom-extractor` | DOM Data Extractor | Extraction | 30s |
| `seo-generator` | SEO Metadata Generator | Generation | 30s |
| `cms-generator` | CMS Content Generator | Generation | 60s |
| `quality-validator` | Quality Validator | Validation | 30s |

---

## Health States

| State | Success Rate | Max Avg Duration | Max Consecutive Failures |
|---|---|---|---|
| `healthy` | >= 90% | <= 30s | <= 2 |
| `warning` | >= 70% | <= 60s | <= 5 |
| `busy` | >= 50% | <= 120s | <= 10 |
| `recovering` | >= 0% | <= 300s | <= 15 |
| `failed` | 0% | unlimited | unlimited |
| `offline` | 0% | unlimited | unlimited |

---

## State Transitions

```
idle → normalizing → extracting → analyzing → generating → validating → completed
  ↓         ↓             ↓            ↓             ↓             ↓
failed    failed        failed       failed        failed        failed
```

---

## History Limits

| Record Type | Max Records |
|---|---|
| Normalizations | 100 |
| Extractions | 100 |
| Generations | 100 |
| Failures | 50 |

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| `maxConcurrentAnalyses` | 3 | Maximum parallel analysis sessions |
| `analysisTimeoutMs` | 120000 | Overall analysis timeout |
| `normalizationTimeoutMs` | 30000 | Normalization step timeout |
| `extractionTimeoutMs` | 60000 | Extraction step timeout |
| `generationTimeoutMs` | 60000 | Generation step timeout |
| `validationTimeoutMs` | 30000 | Validation step timeout |
| `retryLimit` | 2 | Maximum retry attempts |
| `retryDelayMs` | 1000 | Delay between retries |
| `enableCaching` | true | Enable analysis result caching |
| `cacheExpirationMs` | 3600000 | Cache expiration (1 hour) |

---

## TypeScript Modules

| Module | Purpose |
|---|---|
| `analysis-runtime.ts` | Runtime types: module status, session state, records, history limits |
| `analysis-status.ts` | Status types: module states, state transitions, status summary |
| `analysis-health.ts` | Health types: health states, scoring, trends, thresholds |
| `analysis-metrics.ts` | Metrics types: metric definitions, aggregation, retention, reporting |
| `analysis-context.ts` | Context types: execution context, module context, session context |
| `analysis-events.ts` | Event types: normalization, extraction, generation, health, error events |
| `analysis-state.ts` | State types: normalization, extraction, generation, validation states |
