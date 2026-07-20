# Layer 7 — CMS Health

## Overview

This document defines the health monitoring system for the Layer 7 CMS Generation Layer. It covers health states, scoring, thresholds, and quality indicators.

## Health States

| State | Description | Action Required |
|-------|-------------|-----------------|
| `healthy` | CMS generation operating normally | None |
| `warning` | Performance degraded, not critical | Monitor closely |
| `busy` | High load, may cause timeouts | Queue operations |
| `recovering` | Recently recovered from failure | Verify quality |
| `failed` | CMS generation failure detected | Investigate + retry |
| `offline` | CMS generation unreachable | Emergency recovery |
| `recovery-complete` | Recovery successful, back online | Resume operations |
| `unknown` | Health status unknown | Run health check |

## Health Scoring

The health score (0-100) is calculated using weighted metrics:

| Weight | Metric | Description |
|--------|--------|-------------|
| 40% | Success Rate | Percentage of successful generations |
| 20% | Avg Duration | Average generation duration |
| 20% | Error Rate | Percentage of failed generations |
| 20% | Consecutive Failures | Number of consecutive failures |

### Score Thresholds

| Score | Health State |
|-------|-------------|
| ≥ 80 | healthy |
| ≥ 50 | warning |
| ≥ 20 | busy / recovering |
| < 20 | failed / offline |

## Quality Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| SEO Coverage | Percentage of pages with SEO metadata | ≥ 80% |
| Metadata Completeness | Percentage of pages with meta tags | ≥ 90% |
| Link Integrity | Percentage of valid canonical URLs | 100% |
| Duplicate Slug Count | Number of duplicate slugs | 0 |
| Broken Link Count | Number of broken internal links | 0 |
| Missing Metadata Count | Pages missing meta title/description | ≤ 10 |

## Health Check Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| intervalMs | 300000 (5min) | Health check interval |
| minIntervalMs | 60000 (1min) | Minimum interval between checks |
| maxIntervalMs | 600000 (10min) | Maximum interval between checks |
| checkOnGeneration | true | Check health after generation |
| checkOnFailure | true | Check health after failures |
| checkOnQuality | true | Check health after quality validation |

## Health Trend Analysis

Health trends are calculated over configurable windows (default: 10 generations):

| Direction | Change Percent | Description |
|-----------|----------------|-------------|
| improving | > 5% | Health score improving |
| stable | -5% to +5% | Health score stable |
| degrading | < -5% | Health score degrading |

## Monitoring Integration

Health status is available through:
- `cmsHealth.status()` — current health state
- `cmsHealth.score()` — current health score
- `cmsHealth.trend()` — health trend direction
- `cmsHealth.quality()` — quality metrics

All health data is persisted in `runtime/cms-health.json`.
