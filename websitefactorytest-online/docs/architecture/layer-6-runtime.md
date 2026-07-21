# Layer 6 — Data Storage Runtime

## Purpose

This document defines the runtime metadata structures and type systems for the Layer 6 Data Storage Layer. It describes how storage operations are tracked, monitored, and reported.

## Runtime Modules

| Module | File | Purpose |
|--------|------|---------|
| Storage Status | `storage-status.ts` | Current state of the database, table statuses, and operation health |
| Storage Health | `storage-health.ts` | Health state, scoring, thresholds, and health monitoring |
| Storage Metrics | `storage-metrics.ts` | Write/read/transaction duration metrics, table sizes, aggregation |
| Storage Context | `storage-context.ts` | Active operations, configuration, module contexts |
| Storage Events | `storage-events.ts` | Write/read/transaction/health/error event types |
| Storage State | `storage-state.ts` | Session state tracking for writes, reads, transactions, migrations |
| Storage Runtime | `storage-runtime.ts` | Runtime metadata types, pragma status, history records |

## State Machine

```
idle → writing → idle
idle → reading → idle
idle → migrating → idle
idle → backing-up → idle
idle → recovering → idle
any → failed → idle
any → timeout → idle
```

## Health States

| State | Success Rate | Avg Duration | Consecutive Failures | Error Rate |
|-------|-------------|-------------|---------------------|------------|
| healthy | ≥ 90% | ≤ 100ms | ≤ 2 | ≤ 10% |
| warning | ≥ 70% | ≤ 500ms | ≤ 5 | ≤ 30% |
| busy | ≥ 50% | ≤ 2000ms | ≤ 10 | ≤ 50% |
| recovering | any | ≤ 10000ms | ≤ 15 | any |
| failed | any | any | any | any |
| offline | any | any | any | any |

## Configuration Defaults

| Setting | Value | Notes |
|---------|-------|-------|
| journalMode | WAL | Write-Ahead Logging for concurrent reads |
| foreignKeys | true | Enforce FK constraints |
| synchronous | NORMAL | Balance safety and performance |
| cacheSize | 8000 | ~32MB page cache |
| tempStore | MEMORY | Temp tables in memory |
| mmapSize | 256MB | Memory-mapped I/O |
| maxRetries | 3 | Maximum retry attempts |
| retryDelayMs | 1000 | Delay between retries |
| transactionTimeoutMs | 30000 | Transaction timeout |
| queryTimeoutMs | 60000 | Query timeout |
| integrityCheckIntervalMs | 86400000 | Daily integrity checks |

## Integration

All runtime modules are type-definition only. They provide:
- TypeScript interfaces for all storage structures
- Default configuration values
- State transition rules
- History limits

No execution logic exists in these modules. The actual database operations are performed by `src/lib/db.ts` and `src/lib/site.ts`.
