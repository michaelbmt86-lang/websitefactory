# Layer 6 — Data Storage Layer Gap Analysis

## Audit Date

2026-07-18

## Audit Scope

All 13 responsibilities (R1–R13) of the Data Storage Layer. Codebase audit of `src/lib/db.ts`, `src/lib/site.ts`, all API routes, discovery engines, CMS generators, and verification modules.

---

## Responsibility Status Matrix

| Responsibility | Status | File(s) | Notes |
|---|---|---|---|
| R1. Receive Structured Data | ✅ COMPLETE | All writers | Every upstream layer writes through `db` import |
| R2. Validate Schema | ⚠️ PARTIAL | `db.ts`, writers | Schema defined but no runtime validation; relies on SQLite constraints only |
| R3. Normalize Records | ⚠️ PARTIAL | `db.ts`, writers | Defaults set in schema; limited runtime normalization |
| R4. UPSERT Records | ⚠️ PARTIAL | Multiple files | Mixed patterns: INSERT OR REPLACE, INSERT OR IGNORE, manual SELECT-then-UPDATE |
| R5. Maintain Relationships | ⚠️ PARTIAL | `db.ts` | 4 FKs defined but NOT enforced (PRAGMA foreign_keys not set) |
| R6. Maintain Indexes | ✅ COMPLETE | `db.ts` | 27 indexes across 10 tables |
| R7. Maintain Transactions | ❌ MISSING | — | Only 1 transaction (team update); all bulk ops run without transactions |
| R8. Maintain Integrity | ⚠️ PARTIAL | `db.ts` | UNIQUE, NOT NULL, DEFAULT, PK constraints exist; no CHECK constraints |
| R9. Maintain Version History | ❌ MISSING | — | Only ad-hoc ALTER TABLE with try/catch; no migration framework, no version table |
| R10. Provide Query Services | ✅ COMPLETE | `site.ts`, API routes | Full CRUD for all tables; 50+ files use db |
| R11. Provide Statistics | ⚠️ PARTIAL | Multiple files | COUNT/GROUP BY queries exist; no centralized statistics service |
| R12. Generate Storage Reports | ❌ MISSING | — | No storage health reports, no table size tracking, no performance metrics |
| R13. Return Execution Status | ⚠️ PARTIAL | API routes | Status returned in some API responses; no structured status object |

---

## Detailed Findings

### R1. Receive Structured Data — ✅ COMPLETE

**What exists:**
- 50+ files import and use `db` from `src/lib/db.ts`
- All upstream layers (extraction, CMS, verification) write through this single import
- Consistent pattern: `db.prepare(sql).run(...)` for writes

**Assessment:** Fully covers R1. All data flows through the single `db` instance.

---

### R2. Validate Schema — ⚠️ PARTIAL

**What exists:**
- Schema defined with CREATE TABLE IF NOT EXISTS in `db.ts`
- UNIQUE constraints on key columns (url, slug, username)
- NOT NULL on essential fields
- DEFAULT values on optional fields

**What's missing:**
- No runtime schema validation before INSERT/UPDATE
- No type checking on incoming data
- No field length validation
- No enum validation (e.g., status values)
- No JSON validation on JSON columns
- Relies entirely on SQLite to reject violations

---

### R3. Normalize Records — ⚠️ PARTIAL

**What exists:**
- Schema defaults handle most normalization (empty strings, 0, CURRENT_TIMESTAMP)
- `normalizeUrl()` used in some writers
- Slugs computed from titles/URLs

**What's missing:**
- No centralized normalization function
- No URL normalization standardization
- No string trimming before storage
- No consistent slug generation
- No type casting (string → number, string → boolean)

---

### R4. UPSERT Records — ⚠️ PARTIAL

**What exists:**
- `INSERT OR REPLACE INTO cms_pages` (page-generator.ts)
- `INSERT OR IGNORE INTO media_assets` (media-extractor.ts)
- Manual SELECT-then-INSERT/UPDATE for admin user, extracted_products

**What's missing:**
- Inconsistent patterns across tables
- `site_urls` uses manual SELECT-then-INSERT/UPDATE (race condition risk)
- `product_urls` uses manual SELECT-then-INSERT/UPDATE (race condition risk)
- `extracted_products` uses manual SELECT-then-INSERT/UPDATE (race condition risk)
- No `ON CONFLICT` clauses on most tables
- No batch upsert optimization

---

### R5. Maintain Relationships — ⚠️ PARTIAL

**What exists:**
- 4 foreign key constraints defined in CREATE TABLE
- products → categories, categories → self, navigation → self, media_assets → extracted_products

**What's missing:**
- `PRAGMA foreign_keys` is NEVER set — FKs are defined but NOT enforced
- Orphaned rows can exist
- No cascade rules defined (no ON DELETE, no ON UPDATE)
- No referential integrity checks at application level

---

### R6. Maintain Indexes — ✅ COMPLETE

**What exists:**
- 27 indexes across 10 tables
- All use `CREATE INDEX IF NOT EXISTS`
- Cover primary query patterns (slug, status, category, type)

**Assessment:** Fully covers R6. No gaps identified.

**Minor gaps:**
- No composite indexes (e.g., status + category)
- No covering indexes
- No FTS (full-text search) index for `cms_search_index`

---

### R7. Maintain Transactions — ❌ MISSING

**What exists:**
- 1 transaction: `src/app/api/team/route.ts:27-39` (team member batch update)

**What's missing:**
- `detail-extraction-engine.ts` batch extraction runs without transactions
- `extraction-with-recovery.ts` batch operations run without transactions
- `product-discovery-engine.ts` batch inserts run without transactions
- CMS generators (page, brand, collection, blog) run without transactions
- `quality-validator.ts` reads run without transactions
- Seed data insertion runs without transactions
- All bulk operations risk partial commits on failure

---

### R8. Maintain Integrity — ⚠️ PARTIAL

**What exists:**
- PRIMARY KEY on all 23 tables
- UNIQUE constraints on 12 key columns
- NOT NULL on essential fields
- DEFAULT values on optional fields

**What's missing:**
- No CHECK constraints anywhere
- No enum validation (status fields accept any string)
- No JSON validation on JSON columns
- No range checks (e.g., price >= 0)
- No cross-field validation

---

### R9. Maintain Version History — ❌ MISSING

**What exists:**
- 4 ALTER TABLE statements for adding recovery columns (`db.ts:434-443`)
- try/catch pattern to swallow "column exists" errors

**What's missing:**
- No schema version table
- No migration framework (e.g., knex, umzug, custom)
- No migration tracking
- No rollback capability
- No forward/backward migration support
- No migration testing
- Ad-hoc ALTER TABLE only

---

### R10. Provide Query Services — ✅ COMPLETE

**What exists:**
- `src/lib/site.ts` — CRUD for products, categories, navigation, pages, settings, media
- `src/lib/auth.ts` — user lookups, session creation
- 19+ API routes with GET/POST/PUT/DELETE operations
- Discovery engines with SELECT/INSERT/UPDATE queries
- CMS generators with SELECT/INSERT/UPDATE queries

**Assessment:** Fully covers R10. Comprehensive CRUD for all tables.

---

### R11. Provide Statistics — ⚠️ PARTIAL

**What exists:**
- `SELECT COUNT(*)` in seed guards, extraction stats, media counts
- `GROUP BY` in category listing, source page counts, duplicate detection
- Quality scoring in `quality-validator.ts`

**What's missing:**
- No centralized statistics service
- No per-table record count tracking
- No storage size tracking
- No query performance metrics
- No index usage statistics
- No slow query logging
- Statistics computed ad-hoc in each file

---

### R12. Generate Storage Reports — ❌ MISSING

**What exists:**
- Nothing. No storage health reports exist.

**What's missing:**
- No table size reports
- No index usage reports
- No integrity check reports
- No performance benchmark reports
- No storage trend reports
- No capacity planning reports
- No backup status reports

---

### R13. Return Execution Status — ⚠️ PARTIAL

**What exists:**
- API routes return `{ success, error }` responses
- Extraction engines return `ExtractionPipelineResult` with counts
- CMS generators return result objects with counts

**What's missing:**
- No structured `StorageStatusResponse` object
- No per-operation status tracking
- No error count aggregation
- No performance metrics in status
- No storage health in status

---

## Summary

| Category | Count | Responsibilities |
|---|---|---|
| ✅ Complete | 3 | R1, R6, R10 |
| ⚠️ Partial | 6 | R2, R3, R4, R5, R8, R11, R13 |
| ❌ Missing | 4 | R7, R9, R12 |

**Overall Coverage:** 3/13 Complete (23%), 7/13 Partial (54%), 3/13 Missing (23%)

---

## Boundary Violations

| Violation | Location | Description |
|---|---|---|
| None | — | Layer 6 does not crawl, analyze, generate CMS, or deploy. All writes go through `db` import. |

---

## Dead Code

| File | Description |
|---|---|
| `scripts/init-db.ts` | Legacy DB initialization — creates tables not used by main app |
| `scripts/seed.ts` | Legacy seed script — not called by main app |

---

## Duplicate Logic

| Location 1 | Location 2 | Description |
|---|---|---|
| `detail-extraction-engine.ts:246-277` | `extraction-with-recovery.ts:259-289` | Extraction statistics queries duplicated |

---

## Priority Recommendations

| Priority | Gap | Recommendation |
|---|---|---|
| HIGH | R7 (Transactions) | Wrap all bulk operations in transactions — extraction, CMS generation, seed data |
| HIGH | R5 (FK Enforcement) | Enable `PRAGMA foreign_keys = ON` and add ON DELETE/ON UPDATE cascade rules |
| HIGH | R9 (Migration) | Implement schema versioning table and migration framework |
| MEDIUM | R4 (UPSERT) | Standardize on `ON CONFLICT` clauses; replace manual SELECT-then-UPDATE |
| MEDIUM | R2 (Schema Validation) | Add runtime validation before INSERT/UPDATE — type checking, field validation |
| MEDIUM | R12 (Storage Reports) | Implement table size tracking, index usage, integrity checks |
| LOW | R8 (Integrity) | Add CHECK constraints for status enums, price ranges, required JSON |
| LOW | R3 (Normalization) | Create centralized normalization function for URLs, strings, slugs |
| LOW | R11 (Statistics) | Create centralized statistics service with caching |
| LOW | R13 (Status) | Create structured `StorageStatusResponse` type |
