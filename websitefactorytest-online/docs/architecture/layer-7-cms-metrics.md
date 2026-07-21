# Layer 7 — CMS Metrics

## Overview

This document defines the metrics collection and reporting system for the Layer 7 CMS Generation Layer. It covers metric types, aggregation, retention, and reporting.

## Metric Categories

### Duration Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| generationDuration | ms | Total CMS generation duration |
| pageGenerationDuration | ms | Page generation phase |
| brandGenerationDuration | ms | Brand generation phase |
| collectionGenerationDuration | ms | Collection generation phase |
| blogGenerationDuration | ms | Blog generation phase |
| seoGenerationDuration | ms | SEO generation phase |
| searchIndexDuration | ms | Search index generation |
| outputFileDuration | ms | Output file generation |
| qualityValidationDuration | ms | Quality validation |

### Count Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| pagesGenerated | count | CMS pages generated |
| brandsGenerated | count | Brands generated |
| collectionsGenerated | count | Collections generated |
| blogPostsGenerated | count | Blog posts generated |
| seoEntriesGenerated | count | SEO entries generated |
| searchEntriesGenerated | count | Search entries generated |

### Coverage Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| seoCoverage | percent | Pages with SEO metadata |
| metadataCompleteness | percent | Pages with meta tags |
| linkIntegrity | percent | Valid canonical URLs |
| searchCoverage | percent | Indexed entities |

## Aggregation Windows

| Window | Description |
|--------|-------------|
| last5 | Last 5 generations |
| last10 | Last 10 generations |
| last25 | Last 25 generations |
| overall | All recorded generations |

## Retention Policy

| Parameter | Value |
|-----------|-------|
| maxRecordsOverall | 500 |
| retentionDays | 30 |
| compressOldRecords | true |
| archiveAfterDays | 7 |

## Performance Baselines

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Total Generation | < 30s | > 60s | > 120s |
| Page Generation | < 10s | > 20s | > 40s |
| SEO Coverage | > 80% | < 80% | < 50% |
| Metadata Completeness | > 90% | < 90% | < 70% |
| Link Integrity | 100% | < 100% | < 90% |

## Integration

Metrics are collected automatically during CMS generation and persisted in `runtime/cms-metrics.json`.
