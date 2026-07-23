# Phase 9.5A — Read-Only Audit Report

**Audit Areas:**
1. End-to-End Pipeline Continuity
2. Project Isolation
3. SQLite as Single Source of Truth (SSOT)
4. Delivery Chain
5. Factory Repeatability

**Date:** Phase 9.5A
**Scope:** All discovery engines, CMS generators, db.ts, deployment pipeline, delivery report, verification chain

---

## Findings Summary

| Severity | Count |
|----------|-------|
| P0       | 2     |
| P1       | 4     |
| P2       | 5     |
| **Total**| **11**|

---

## P0 — Critical (Delivery chain lies / Data loss)

### F1. Delivery report references wrong check names → always shows FAILED
**File:** `deployment/deploy.ts:1208-1214`
**Area:** Delivery Chain

`buildDeliveryReport()` looks for check names `"https_apex_200"` and `"https_www_200"` and `"dns_configured"`, but the actual pipeline check IDs are:
- `"https_apex_ok"` (not `"https_apex_200"`)
- `"https_www_ok"` (not `"https_www_200"`)

**Impact:** `httpsStatus` in the delivery report ALWAYS evaluates to `"FAILED"` even when the real HTTPS checks pass. The delivery report lies about HTTPS status. The Cloudflare DNS check name also doesn't match: `"cloudflare_dns_verified"` vs the pipeline's `"configure_cloudflare_dns"`.

**Fix:** Update `buildDeliveryReport()` to match actual check IDs from the pipeline executor keys.

---

### F2. Blog post pages from site_urls silently lost on CMS regeneration
**File:** `src/discovery/cms/page-generator.ts:46` + `src/discovery/cms/blog-generator.ts:25-80`
**Area:** End-to-End Pipeline Continuity

`generatePages()` does `DELETE FROM cms_pages` (line 46) and rebuilds from `site_urls` + `extracted_products`. Blog URLs from `site_urls` are inserted as `"blog-listing"` type. Then `generateBlogPosts()` runs separately and does upsert-by-URL to write `"blog-post"` type entries.

**Problem:** If a blog URL exists in `site_urls` but NOT in the `posts` table, `generatePages()` creates it as `"blog-listing"`, then `generateBlogPosts()` doesn't touch it (it only processes rows from `posts`). The page exists with wrong type. If the `posts` table has entries, `generateBlogPosts()` overwrites the `page_type` to `"blog-post"` — but the `description` from the posts table replaces the site_urls description. There's no conflict resolution between the two sources.

**Impact:** On repeated CMS regeneration, blog pages can have inconsistent types depending on whether the `posts` table has matching entries. Not a data loss per se, but a correctness gap in the pipeline contract.

**Fix:** `generateBlogPosts()` should run BEFORE `generatePages()` builds its initial list, or `generatePages()` should skip URLs that will be handled by `generateBlogPosts()`. Standardize the order: pages → blog posts (overwrite).

---

## P1 — High (Incorrect state / Missing safeguards)

### F3. State persistence doesn't record which step failed → restart always from step 1
**File:** `deployment/deploy.ts:1055-1065`
**Area:** Factory Repeatability

`withPersistence()` saves state after every successful step, but never records `lastCompletedStep`. On rerun, `buildInitialState()` loads persisted state (Vercel project ID, etc.) but doesn't know where to resume. The entire workflow restarts from step 1.

**Impact:** Already-created GitHub repos or Vercel projects cause duplicate-create attempts (mitigated by `repoExists` / `findProjectByName` checks), but it's wasteful. DNS/SSL verification steps re-run unnecessarily.

**Fix:** Add `lastCompletedStep: string` to `PersistedDeploymentState` and `PipelineState`. In `loadAndRunWorkflow()`, skip steps that precede `lastCompletedStep`.

---

### F4. CMS generators use DELETE+INSERT — not safe for concurrent/parallel runs
**Files:**
- `page-generator.ts:46` — `DELETE FROM cms_pages`
- `brand-generator.ts:25` — `DELETE FROM cms_brands`
- `collection-generator.ts:25` — `DELETE FROM cms_collections`
- `seo-generator.ts:19` — `DELETE FROM cms_seo`
- `search-index-generator.ts` — `DELETE FROM cms_search_index`

**Area:** Project Isolation / Factory Repeatability

All CMS generators DELETE all rows, then INSERT. If two CMS generation calls run concurrently (unlikely but possible via dashboard), one call's data is wiped by the other. Also, if the process crashes mid-generation, the DELETE has already committed but INSERT hasn't finished → empty tables.

**Impact:** No crash recovery for CMS generation. Concurrent calls corrupt data.

**Fix:** Use a transaction: `BEGIN TRANSACTION` → DELETE → INSERT → `COMMIT`. Or better: use UPSERT (INSERT OR REPLACE) pattern and avoid DELETE entirely. Add `checkpointWal()` call after CMS generation.

---

### F5. No transaction wrapping multi-step CMS generation
**File:** `src/discovery/cms/cms-generator-engine.ts:54-143`
**Area:** SQLite SSOT / Factory Repeatability

`generateCms()` runs 6 generators sequentially (pages → brands → collections → blog → seo → search), each doing independent DELETE+INSERT. If generator 4 (blog) fails, generators 1-3 are committed but 5-6 never run → partial CMS state with no warning.

**Impact:** CMS generation is not atomic. Partial state is indistinguishable from complete state in the database.

**Fix:** Wrap the 6 generators in a `db.transaction()` (better-sqlite3 supports this). On failure, all changes roll back. Log the failure clearly.

---

### F6. `slugify()` duplicated in 4 generator files
**Files:**
- `page-generator.ts:13-18`
- `brand-generator.ts:12-17`
- `collection-generator.ts:12-17`
- `seo-generator.ts` (imports toProductUrl instead)

**Area:** Factory Repeatability

Four copies of identical `slugify()`. If one is changed (e.g., to handle unicode), the others become inconsistent.

**Fix:** Extract to `src/lib/slugify.ts` and import everywhere. (Or add to existing `src/lib/utils.ts` if appropriate.)

---

## P2 — Medium (Minor gaps / Dead code)

### F7. Extraction metrics in-memory only — lost on process restart
**File:** `src/discovery/extraction/extraction-manager.ts`
**Area:** SQLite SSOT

`extraction_metrics` table exists in SQLite schema, but `getExtractionMetrics()` / `getExtractionMetricsSummary()` read from in-memory arrays, not the SQLite table. Process restart loses all metrics.

**Impact:** Dashboard shows `recovery: null` after cold start. Metrics are not queryable.

**Fix:** Read from `extraction_metrics` SQLite table instead of in-memory arrays.

---

### F8. Dead code block in deploy.ts
**File:** `deployment/deploy.ts:252-259`
**Area:** Factory Repeatability

```typescript
/* ============================================================================
 * Unique project name generator
 *
 * Tries: slug → slug-2 → slug-3 → slug-YYYYMMDD → slug-YYYYMMDD-2
 * Never reuses an existing Vercel project.
 * ============================================================================
 */
```
Empty block comment with no code. Leftover from a removed feature.

**Fix:** Delete the dead comment block.

---

### F9. Seed data inserted unconditionally on every DB init — no versioning
**File:** `src/lib/db.ts:486-538`
**Area:** SQLite SSOT / Factory Repeatability

Seed data (settings, categories, navigation, posts) is inserted only if the table is empty (`COUNT(*) === 0`). Admin user is UPSERTed. However:
- No migration tracking table exists
- No way to update seed data schema if columns change
- No way to add new seed data without manual DB intervention

**Impact:** Low today, but blocks future schema evolution without manual steps.

**Fix:** Add a `schema_version` table with version number. Run migrations only when version changes. Keep current behavior as fallback.

---

### F10. `recoverDatabase()` creates new connection without closing old one
**File:** `src/lib/db.ts:580-592`
**Area:** SQLite SSOT

`recoverDatabase()` calls `new Database(dbPath)` without closing the existing `db` connection. The old connection may hold stale WAL state.

**Impact:** Potential WAL corruption if old connection is still referenced elsewhere.

**Fix:** Add `db.close()` before creating new connection. Return the new connection and update the `db` export (or refactor to use a module-level singleton with proper close/reopen).

---

### F11. `buildDeliveryReport` references stale check names not in current pipeline
**File:** `deployment/deploy.ts:1200-1234`
**Area:** Delivery Chain

`buildDeliveryReport()` reads `httpsCheck6`, `httpsCheck7`, `dnsCheck`, `cfCheck`, `buildCheck` by name. These names (`"https_apex_200"`, `"https_www_200"`, `"dns_configured"`, `"cloudflare_dns_verified"`, `"deployment_ready"`) don't match the current pipeline check IDs. This is the same root cause as F1 but applies to the delivery report specifically.

**Note:** F11 is the specific manifestation of the broader F1 issue — documented separately for clarity.

---

## Recommended Fix Priority

1. **F1/F11** — Fix delivery report check name lookups (P0, 5 min)
2. **F5** — Wrap CMS generation in transaction (P1, 15 min)
3. **F4** — Replace DELETE+INSERT with transactional upsert in generators (P1, 30 min)
4. **F2** — Standardize blog post generation order (P1, 15 min)
5. **F3** — Add lastCompletedStep to persistence (P1, 20 min)
6. **F6** — Extract slugify to shared utility (P2, 10 min)
7. **F7** — Read extraction metrics from SQLite (P2, 15 min)
8. **F8** — Remove dead code block (P2, 1 min)
9. **F9** — Add schema_version table (P2, 20 min)
10. **F10** — Fix recoverDatabase connection leak (P2, 10 min)
