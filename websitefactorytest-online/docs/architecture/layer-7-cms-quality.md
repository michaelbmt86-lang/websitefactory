# Layer 7 — CMS Quality

## Overview

This document defines the quality assurance system for the Layer 7 CMS Generation Layer. It covers validation checks, quality gates, issue severity, and reporting.

## Quality Dimensions

### 1. Metadata Completeness

| Check | Scope | Severity | Description |
|-------|-------|----------|-------------|
| missing-metadata | cms_pages | warning | Pages missing meta title or meta description |
| missing-seo | cms_pages | warning | Pages missing Open Graph tags |
| empty-description | cms_pages, cms_brands, cms_collections | warning | Entities with empty descriptions |

### 2. SEO Coverage

| Check | Scope | Severity | Description |
|-------|-------|----------|-------------|
| seo-coverage | cms_seo | info | Percentage of pages with SEO metadata |

### 3. Link Integrity

| Check | Scope | Severity | Description |
|-------|-------|----------|-------------|
| broken-link | cms_seo | error | Canonical URLs pointing to non-existent pages |

### 4. Data Quality

| Check | Scope | Severity | Description |
|-------|-------|----------|-------------|
| duplicate-slug | all cms tables | error | Duplicate slugs within same entity type |
| missing-image | cms_brands, cms_collections | info | Brands/Collections missing images |

## Quality Gates

### Pre-Deployment Gates

| Gate | Threshold | Blocks Deployment |
|------|-----------|-------------------|
| SEO Coverage | ≥ 80% | Yes |
| Broken Links | 0 | Yes |
| Duplicate Slugs | 0 | Yes |
| Missing Metadata | ≤ 10 | Yes |

### Quality Score Calculation

```
qualityScore = (passedChecks / totalChecks) * 100
```

| Score | Status | Action |
|-------|--------|--------|
| ≥ 90% | excellent | No action needed |
| ≥ 75% | good | Monitor closely |
| ≥ 60% | fair | Investigate issues |
| < 60% | poor | Immediate remediation |

## Issue Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| error | Must be fixed before deployment | Block deployment |
| warning | Should be fixed, blocks quality gate | Require fix |
| info | Informational, does not block | Log only |

## Quality Reports

### Report Contents

- Aggregate issue counts by severity
- Aggregate issue counts by entity type
- Full issue list with entity slug, type, issue type, message
- Quality score
- Overall status (PASS/WARN/FAIL)

### Report Storage

Quality reports are stored in:
- `runtime/cms-health.json` (quality metrics)
- `runtime/cms-history.json` (quality check records)
- Dashboard quality page (real-time display)

## Integration

Quality validation is performed automatically:
- After every CMS generation (phase 8)
- On-demand via API call
- Via dashboard quality page
