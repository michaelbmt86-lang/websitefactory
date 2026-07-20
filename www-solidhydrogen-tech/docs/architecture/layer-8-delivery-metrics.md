# Layer 8 — Delivery Metrics

## Overview

Layer 8 delivery metrics track deployment performance, success rates, timing, and verification results. Metrics are collected per deployment and aggregated across time windows.

## Metric Categories

### Deployment Counts
| Metric | Unit | Description |
|--------|------|-------------|
| deployment-total | count | Total deployment attempts |
| deployment-success | count | Successful deployments |
| deployment-failure | count | Failed deployments |
| deployment-rollback | count | Rolled back deployments |

### Timing Metrics
| Metric | Unit | Description |
|--------|------|-------------|
| timing-build | ms | Build artifact compilation time |
| timing-git-push | ms | GitHub push duration |
| timing-vercel-deploy | ms | Vercel deployment + polling duration |
| timing-dns-configure | ms | Cloudflare DNS configuration time |
| timing-dns-verify | ms | DNS propagation verification time |
| timing-https-verify | ms | HTTPS certificate verification time |
| timing-production-verify | ms | Production verification check time |
| timing-total-pipeline | ms | End-to-end pipeline duration |

### Verification Metrics
| Metric | Unit | Description |
|--------|------|-------------|
| verification-total | count | Total verification checks run |
| verification-passed | count | Checks that passed |
| verification-failed | count | Checks that failed |

## Aggregation Windows

| Window | Description |
|--------|-------------|
| current | Active deployment only |
| 1h | Last hour |
| 24h | Last 24 hours |
| 7d | Last 7 days |
| 30d | Last 30 days |

**Rollup interval:** 1 hour (metrics older than current window are aggregated)

## Retention Policy

| Setting | Value |
|---------|-------|
| Max history records | 100 |
| Max days retained | 90 |

## Summary Metrics

The `DeliveryMetricsSummary` interface provides:
- `totalDeployments` — Total count
- `successfulDeployments` — Success count
- `failedDeployments` — Failure count
- `rolledBackDeployments` — Rollback count
- `successRate` — successRate = successfulDeployments / totalDeployments × 100
- `averageDeploymentTime` — Mean pipeline duration
- `averageVerificationTime` — Mean verification duration

## Runtime Module

See `src/deployment/runtime/delivery-metrics.ts` for type definitions and constants.
