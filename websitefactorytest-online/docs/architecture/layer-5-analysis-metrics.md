# Layer 5 — Analysis Metrics

## Overview

Analysis metrics track the performance, throughput, and quality of each analysis module in the Layer 5 AI Analysis Layer. Metrics are collected per module and per URL, with configurable aggregation windows and retention.

---

## Metrics Categories

### Normalization Metrics

| Metric | Unit | Aggregation | Per Module | Per URL |
|---|---|---|---|---|
| `normalizationTime` | ms | avg, min, max, p95, p99 | Yes | No |
| `htmlStripTime` | ms | avg, min, max, p95 | Yes | No |
| `cssExtractionTime` | ms | avg, min, max, p95 | Yes | No |
| `mediaNormalizationTime` | ms | avg, min, max, p95 | Yes | No |
| `urlNormalizationTime` | ms | avg, min, max, p95 | Yes | No |
| `inputHtmlSizeBytes` | bytes | avg, min, max | No | Yes |
| `outputHtmlSizeBytes` | bytes | avg, min, max | No | Yes |
| `mediaAssetsProcessed` | count | avg, min, max | No | Yes |
| `urlsNormalized` | count | avg, min, max | No | Yes |

### Extraction Metrics

| Metric | Unit | Aggregation | Per Module | Per URL |
|---|---|---|---|---|
| `extractionTime` | ms | avg, min, max, p95, p99 | Yes | No |
| `titleExtractionTime` | ms | avg, min, max, p95 | Yes | No |
| `specExtractionTime` | ms | avg, min, max, p95 | Yes | No |
| `faqExtractionTime` | ms | avg, min, max, p95 | Yes | No |
| `structureExtractionTime` | ms | avg, min, max, p95 | Yes | No |
| `titlesExtracted` | count | avg, min, max | No | Yes |
| `specsExtracted` | count | avg, min, max | Yes | Yes |
| `faqExtracted` | count | avg, min, max | Yes | Yes |
| `imagesExtracted` | count | avg, min, max | Yes | Yes |
| `downloadsExtracted` | count | avg, min, max | Yes | Yes |

### Analysis Metrics

| Metric | Unit | Aggregation | Per Module | Per URL |
|---|---|---|---|---|
| `analysisTime` | ms | avg, min, max, p95, p99 | Yes | No |
| `heuristicParseTime` | ms | avg, min, max, p95 | Yes | No |
| `normalizationTime` | ms | avg, min, max, p95 | Yes | No |
| `fieldsExtracted` | count | avg, min, max | Yes | Yes |
| `specsExtracted` | count | avg, min, max | Yes | Yes |
| `faqExtracted` | count | avg, min, max | Yes | Yes |
| `tagsExtracted` | count | avg, min, max | Yes | Yes |
| `breadcrumbsExtracted` | count | avg, min, max | Yes | Yes |

### Generation Metrics

| Metric | Unit | Aggregation | Per Module | Per URL |
|---|---|---|---|---|
| `generationTime` | ms | avg, min, max, p95, p99 | Yes | No |
| `pageGenerationTime` | ms | avg, min, max, p95 | Yes | No |
| `brandGenerationTime` | ms | avg, min, max, p95 | Yes | No |
| `collectionGenerationTime` | ms | avg, min, max, p95 | Yes | No |
| `blogGenerationTime` | ms | avg, min, max, p95 | Yes | No |
| `pagesGenerated` | count | avg, min, max | Yes | No |
| `brandsGenerated` | count | avg, min, max | Yes | No |
| `collectionsGenerated` | count | avg, min, max | Yes | No |
| `blogPostsGenerated` | count | avg, min, max | Yes | No |
| `seoPagesGenerated` | count | total, avg | Yes | No |
| `seoCoveragePercent` | percent | avg, min, max | Yes | No |

### Validation Metrics

| Metric | Unit | Aggregation | Per Module | Per URL |
|---|---|---|---|---|
| `validationTime` | ms | avg, min, max, p95, p99 | Yes | No |
| `scoringTime` | ms | avg, min, max, p95 | Yes | No |
| `reportTime` | ms | avg, min, max, p95 | Yes | No |
| `totalIssuesFound` | count | avg, min, max | Yes | Yes |
| `errorsFound` | count | avg, min, max | Yes | Yes |
| `warningsFound` | count | avg, min, max | Yes | Yes |
| `qualityScore` | score | avg, min, max | No | Yes |

---

## Aggregation Windows

| Window | Description |
|---|---|
| `last10` | Last 10 analyses |
| `last50` | Last 50 analyses |
| `last100` | Last 100 analyses |
| `overall` | All analyses since startup |

---

## Retention

| Setting | Default | Description |
|---|---|---|
| `maxRecordsPerModule` | 1000 | Maximum records per module |
| `maxRecordsOverall` | 5000 | Maximum records overall |
| `retentionDays` | 30 | Days to retain metrics |
| `compressOldRecords` | true | Compress records older than 7 days |
| `archiveAfterDays` | 7 | Days before archiving |

---

## Overall Metrics Summary

| Metric | Description |
|---|---|
| `totalAnalyses` | Total analyses performed |
| `totalNormalizations` | Total normalizations performed |
| `totalExtractions` | Total extractions performed |
| `totalGenerations` | Total generations performed |
| `totalValidations` | Total validations performed |
| `overallAvgAnalysisMs` | Overall average analysis time |
| `overallAvgNormalizationMs` | Overall average normalization time |
| `overallAvgExtractionMs` | Overall average extraction time |
| `overallAvgGenerationMs` | Overall average generation time |
| `overallAvgQualityScore` | Overall average quality score |

---

## TypeScript Interfaces

```typescript
interface AnalysisMetricSummary {
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  p99Ms?: number;
}

interface AnalysisMetricCount {
  total: number;
  avg: number;
  min?: number;
  max?: number;
}

type AnalysisMetricsWindow = "last10" | "last50" | "last100" | "overall";
```
