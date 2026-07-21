# Layer 6 — Storage Metrics

## Overview

This document defines the metrics collection and reporting system for the Layer 6 Data Storage Layer. It covers metric types, aggregation, retention, and reporting.

## Metric Categories

### Duration Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| writeDuration | ms | INSERT/UPDATE/DELETE operations |
| readDuration | ms | SELECT operations |
| transactionDuration | ms | BEGIN/COMMIT/ROLLBACK |
| upsertDuration | ms | INSERT OR UPDATE operations |
| batchDuration | ms | Bulk operations |
| migrationDuration | ms | Schema migrations |

### Size Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| tableSize | bytes | Individual table size |
| indexSize | bytes | Individual index size |
| totalSizeBytes | bytes | Total database size |
| pageSizeBytes | bytes | Page size (default 4096) |
| totalPages | count | Total pages |
| freelistPages | count | Free pages |
| walSizeBytes | bytes | WAL file size |

### Count Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| totalRows | count | Row count per table |
| avgRowSize | bytes | Average row size |
| totalWrites | count | Total write operations |
| totalReads | count | Total read operations |
| totalTransactions | count | Total transactions |
| totalUpserts | count | Total upsert operations |
| totalBatches | count | Total batch operations |

## Aggregation Windows

| Window | Description |
|--------|-------------|
| last10 | Last 10 operations |
| last50 | Last 50 operations |
| last100 | Last 100 operations |
| overall | All recorded operations |

## Retention Policy

| Parameter | Value |
|-----------|-------|
| maxRecordsPerTable | 1000 |
| maxRecordsOverall | 5000 |
| retentionDays | 30 |
| compressOldRecords | true |
| archiveAfterDays | 7 |

## Reporting

| Parameter | Value |
|-----------|-------|
| reportToLayer3 | true |
| reportFormat | json |
| includeTimestamps | true |
| includeTableBreakdown | true |
| includeOverallSummary | true |

## Table-Specific Metrics

Each table tracks:
- Row count
- Size in bytes
- Number of indexes
- Average row size
- Write duration (avg, min, max, p95, p99)
- Read duration (avg, min, max, p95, p99)
- Upsert duration (avg, min, max, p95)
- Batch duration (avg, min, max, p95)

## Performance Baselines

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Write Duration | < 10ms | > 50ms | > 200ms |
| Read Duration | < 5ms | > 20ms | > 100ms |
| Transaction Duration | < 50ms | > 200ms | > 1000ms |
| Database Size | < 100MB | > 500MB | > 1GB |
| Table Row Count | < 10000 | > 50000 | > 100000 |

## Integration

Metrics are collected automatically during storage operations and persisted in `runtime/storage-metrics.json`.
