# Layer 7 — Gap Analysis

## Date
2026-07-18

## Summary

| Metric | Value |
|--------|-------|
| Total Responsibilities | 13 |
| Complete | 9 |
| Partial | 3 |
| Missing | 1 |
| Maturity | 69% |

## Responsibilities Assessment

### Complete (9/13)

| ID | Responsibility | Files | Lines | Evidence |
|----|---------------|-------|-------|----------|
| R1 | Page Generation | page-generator.ts | 136 | Full implementation: site_urls + extracted_products → cms_pages |
| R2 | Brand Generation | brand-generator.ts | 65 | Full implementation: extracted_products → cms_brands |
| R3 | Collection Generation | collection-generator.ts | 69 | Full implementation: categories → cms_collections |
| R4 | Blog Generation | blog-generator.ts | 89 | Full implementation: posts → cms_pages (blog-post type) |
| R5 | SEO Generation | seo-generator.ts | 57 | Full implementation: cms_pages → cms_seo |
| R6 | Search Index Generation | search-index-generator.ts | 94 | Full implementation: 5 entity types → cms_search_index |
| R7 | Navigation Generation | cms-output-generator.ts:116-205 | ~90 | Full implementation: hierarchical main + footer nav |
| R10 | Output Packaging | cms-output-generator.ts | 263 | Full implementation: manifest, search, nav, sitemap |
| R11 | Quality Validation | cms-quality-validator.ts | 154 | Full implementation: 5 validation checks |

### Partial (3/13)

| ID | Responsibility | Status | Gap |
|----|---------------|--------|-----|
| R8 | Schema Generation | Partial | Structured data carried forward from extraction (json_ld, schema_json). No standalone schema generator. Schema is copied from site_urls.json_ld and extracted_products.schema_json into cms_pages.schema_json and cms_seo.schema_json. |
| R9 | Internal Link Validation | Partial | Link validation exists in cms-quality-validator.ts (check #5: broken internal links). No standalone link generation or link graph. |
| R12 | CMS Output Delivery | Partial | Output files written to docs/discovery/. No integration with Layer 8 (Deployment) pipeline. No CDN-aware output. |

### Missing (1/13)

| ID | Responsibility | Gap | Impact |
|----|---------------|-----|--------|
| R13 | Incremental Generation | No support for partial/incremental regeneration. Full regeneration every time. | Performance: regenerates all entities even for small changes |

## Architecture Lock Compliance

| Check | Status | Notes |
|-------|--------|-------|
| SQLite remains Single Source of Truth | PASS | All CMS data in 5 SQLite tables |
| No secondary database | PASS | No Redis, Postgres, or other DB |
| No duplicated storage | PASS | Single source per entity |
| No schema modifications | PASS | Schema defined in db.ts, not modified |
| No runtime integration performed | PASS | CMS generators are standalone functions |
| No behaviour changes | PASS | Existing functionality preserved |

## Compatibility Analysis

| System | Status | Notes |
|--------|--------|-------|
| Layer 4 (Browser Extraction) | PASS | No changes. Reads from same tables. |
| Layer 5 (AI Analysis) | PASS | No changes. Analysis context registers cms-generator as component. |
| Layer 6 (Data Storage) | PASS | No changes. CMS tables unchanged. |
| Dashboard | PASS | No changes. Dashboard reads CMS tables. |
| API | PASS | No changes. cms-generator API route unchanged. |
| Deployment | PASS | No changes. Output files unchanged. |
| Discovery Engine | PASS | No changes. Phase 4 pipeline unchanged. |

## Duplicate Logic Detection

| Pattern | Location 1 | Location 2 | Issue |
|---------|-----------|-----------|-------|
| slugify() | page-generator.ts:130-135 | brand-generator.ts:60-64, collection-generator.ts:64-68 | Duplicated helper function across 3 files |
| db.prepare() calls | All 8 generators | Raw SQL in each file | No shared database abstraction |
| DELETE ALL + INSERT | brand, collection, seo, search generators | Each does its own clear-and-repopulate | No shared bulk-write pattern |
| INSERT OR REPLACE | page-generator.ts | blog-generator.ts | Same upsert pattern, different approaches |

## Dead Code Detection

| File | Lines | Issue |
|------|-------|-------|
| scripts/research-importer.mjs | 334 | Phase 4.5 fallback script, hardcoded to solidhydrogen.tech. Site-specific, not reusable. |
| src/discovery/output-generator.ts (cmsGenerator section) | ~20 | Hardcoded to 0s in delivery report template. Never populated with real data. |

## Boundary Violations

| Violation | Severity | Description |
|-----------|----------|-------------|
| None detected | N/A | Layer 7 stays within its boundaries. Reads from upstream tables, writes to CMS tables, generates output files. |

## Policy Coverage

| Policy | Coverage | Gap |
|--------|----------|-----|
| sqlite-policy.json | 0% | No connection management, no pragma config awareness |
| storage-policy.json | 0% | No batch write patterns, no query optimization |
| transaction-policy.json | 0% | No transaction wrapping for multi-table writes |
| backup-policy.json | 0% | No backup before CMS generation |
| integrity-policy.json | 0% | No integrity checks before/after generation |
| migration-policy.json | 0% | No migration involvement |

## Workflow Coverage

| Workflow | Coverage | Gap |
|----------|----------|-----|
| storage-workflow.json | 0% | CMS generators bypass the storage workflow |
| backup-workflow.json | 0% | No backup workflow usage |
| recovery-workflow.json | 0% | No recovery workflow usage |

## Implementation Quality Assessment

| Aspect | Score | Notes |
|--------|-------|-------|
| Functionality | 9/13 | Core generation works, missing incremental |
| Type Safety | Good | 22 type definitions in discovery.ts |
| Error Handling | Poor | Minimal try/catch, no retry logic |
| Test Coverage | None | No unit tests for CMS generators |
| Documentation | Good | Type definitions are clear |
| Performance | Fair | Full regeneration only, no caching |
| Modularity | Good | Each generator is a separate file |
| Reusability | Fair | slugify() duplicated, no shared utilities |

## Current Maturity

| Metric | Before | After |
|--------|--------|-------|
| Complete responsibilities | N/A | 9/13 |
| Partial responsibilities | N/A | 3/13 |
| Missing responsibilities | N/A | 1/13 |
| Maturity score | N/A | 69% |

## Upgrade Readiness

| Aspect | Ready? | Notes |
|--------|--------|-------|
| Step B (Infrastructure) | YES | Can add policies, workflows, runtime, TS modules |
| Step C (Regression) | YES | Can validate and generate reports |
| Step D (Wiring) | YES | Can wire into actual runtime |

## Recommended Step B Priorities

1. **Create policies** — Add CMS-specific policies for generation patterns
2. **Create workflows** — Define CMS generation workflow with error handling
3. **Create runtime modules** — Add CMS generation status, health, metrics tracking
4. **Create TS modules** — Add type definitions for CMS generation infrastructure
5. **Fix slugify duplication** — Extract shared utility
6. **Add transaction wrapping** — Wrap multi-table writes in transactions
7. **Add error handling** — Add retry logic, partial failure recovery
8. **Add incremental generation** — Support partial regeneration
