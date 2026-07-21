# Layer 7 — CMS Generation Runtime

## Purpose

This document defines the runtime metadata structures and type systems for the Layer 7 CMS Generation Layer. It describes how CMS generation operations are tracked, monitored, and reported.

## Runtime Modules

| Module | File | Purpose |
|--------|------|---------|
| CMS Status | `cms-status.ts` | Generation state, phase progress, table statuses |
| CMS Health | `cms-health.ts` | Health state, scoring, thresholds, quality indicators |
| CMS Metrics | `cms-metrics.ts` | Generation duration, record counts, coverage percentages |
| CMS Context | `cms-context.ts` | Active operations, configuration, phase contexts |
| CMS Events | `cms-events.ts` | Generation, phase, quality, health, error event types |
| CMS State | `cms-state.ts` | Session state tracking for generations, quality, output |
| CMS Runtime | `cms-runtime.ts` | Runtime metadata types, phase status, history records |

## State Machine

```
idle → generating → validating → delivering → completed
                   ↘           ↘           ↘
                    failed      failed      failed
                    timeout     timeout     timeout
                    partial
any completed/failed → idle
```

## Health States

| State | Success Rate | Avg Duration | Consecutive Failures | Error Rate |
|-------|-------------|-------------|---------------------|------------|
| healthy | ≥ 90% | ≤ 30s | ≤ 2 | ≤ 10% |
| warning | ≥ 70% | ≤ 60s | ≤ 5 | ≤ 30% |
| busy | ≥ 50% | ≤ 120s | ≤ 10 | ≤ 50% |
| recovering | any | ≤ 300s | ≤ 15 | any |
| failed | any | any | any | any |
| offline | any | any | any | any |

## Phase Configuration

| Phase | Priority | Timeout | Tables Read | Tables Write |
|-------|----------|---------|-------------|--------------|
| pages | 1 | 30s | site_urls, extracted_products | cms_pages |
| brands | 2 | 15s | extracted_products | cms_brands |
| collections | 3 | 15s | extracted_products | cms_collections |
| blog | 4 | 15s | posts, cms_pages | cms_pages |
| seo | 5 | 15s | cms_pages | cms_seo |
| search-index | 6 | 15s | cms_pages, extracted_products, cms_brands, cms_collections | cms_search_index |
| output-files | 7 | 15s | all CMS tables | (files) |
| quality-validation | 8 | 15s | cms_pages, cms_brands, cms_collections, cms_seo | (none) |

## Integration

All runtime modules are type-definition only. They provide:
- TypeScript interfaces for all CMS generation structures
- Default configuration values
- State transition rules
- History limits

No execution logic exists in these modules. The actual CMS generation is performed by `src/discovery/cms/`.
