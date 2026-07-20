# Layer 6 — Storage Health

## Overview

This document defines the health monitoring system for the Layer 6 Data Storage Layer. It covers health states, scoring, thresholds, and monitoring configuration.

## Health States

| State | Description | Action Required |
|-------|-------------|-----------------|
| `healthy` | Database operating normally | None |
| `warning` | Performance degraded, not critical | Monitor closely |
| `busy` | High load, may cause timeouts | Queue operations |
| `recovering` | Recently recovered from failure | Verify integrity |
| `failed` | Database failure detected | Initiate recovery |
| `offline` | Database unreachable | Emergency recovery |
| `recovery-complete` | Recovery successful, back online | Resume operations |
| `unknown` | Health status unknown | Run health check |

## Health Scoring

The health score (0-100) is calculated using weighted metrics:

| Weight | Metric | Description |
|--------|--------|-------------|
| 40% | Success Rate | Percentage of successful operations |
| 20% | Avg Duration | Average operation duration |
| 20% | Error Rate | Percentage of failed operations |
| 20% | Consecutive Failures | Number of consecutive failures |

### Score Thresholds

| Score | Health State |
|-------|-------------|
| ≥ 80 | healthy |
| ≥ 50 | warning |
| ≥ 20 | busy / recovering |
| < 20 | failed / offline |

## Health Check Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| intervalMs | 300000 (5min) | Health check interval |
| minIntervalMs | 60000 (1min) | Minimum interval between checks |
| maxIntervalMs | 600000 (10min) | Maximum interval between checks |
| checkOnWrite | true | Check health after writes |
| checkOnFailure | true | Check health after failures |
| checkOnRecovery | true | Check health after recovery |

## Pragma Health

| Pragma | Expected | Warning | Critical |
|--------|----------|---------|----------|
| journal_mode | WAL | != WAL | N/A |
| foreign_keys | ON | != ON | N/A |
| synchronous | NORMAL | OFF or EXTRA | N/A |
| cache_size | ≥ 8000 | < 4000 | < 1000 |

## Health Trend Analysis

Health trends are calculated over configurable windows (default: 50 operations):

| Direction | Change Percent | Description |
|-----------|----------------|-------------|
| improving | > 5% | Health score improving |
| stable | -5% to +5% | Health score stable |
| degrading | < -5% | Health score degrading |

## Monitoring Integration

Health status is available through:
- `storageHealth.status()` — current health state
- `storageHealth.score()` — current health score
- `storageHealth.trend()` — health trend direction
- `storageHealth.pragmas()` — pragma health status

All health data is persisted in `runtime/storage-health.json`.
