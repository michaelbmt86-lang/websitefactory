# Architecture Lock Snapshot

**Date:** 2026-07-21
**Status:** FROZEN — Read-only reference for all future work
**Evidence Sources:** Phase 6, 7, 8.1, 8.1.5 verification reports

---

## 1. Core Pipeline

```
Customer
  ↓
JCodesMore
  ↓
OpenCode / Agent Execution
  ↓
Website Factory Orchestrator
  ↓
Discovery Layer
  ↓
CMS
  ↓
Dashboard
  ↓
GitHub
  ↓
Vercel
  ↓
Cloudflare
```

**Evidence:** `PHASE8_1_PIPELINE_DRY_RUN.md` — 6-stage pipeline verified end-to-end. Single CLI entry point: `src/cli/website-factory.ts`. Orchestrator: `src/orchestrator/website-factory-orchestrator.ts`.

---

## 2. Acquisition Architecture

### Primary Browser Acquisition

**Chrome DevTools MCP** (L0 — Primary)

| Property | Value |
|----------|-------|
| File | `src/lib/mcp-client.ts` |
| Implementation | stdio MCP client via `@modelcontextprotocol/sdk` |
| Process | `npx -y chrome-devtools-mcp@latest --headless --isolated` |
| Browser | Headless Chromium (managed by MCP server) |
| Connection | Singleton, lazy init, 30-min idle timeout |
| Retries | 2 per engine |

### Recovery Layer

**L1: JCodesMore Browser Recovery**

| Property | Value |
|----------|-------|
| File | `src/discovery/extraction/jcodesmore-engine.ts` |
| Method | Native `fetch()` with browser-like headers |
| Post-processing | `expandHiddenContent()`, `extractLazyContent()` |
| Content validation | Minimum 200 chars |
| Retries | 2 per engine |

**L2: Firecrawl Recovery**

| Property | Value |
|----------|-------|
| File | `src/discovery/extraction/firecrawl-engine.ts` |
| Method A | Firecrawl REST API (`api.firecrawl.dev/v1/scrape`) — optional |
| Method B | Aggressive HTTP fallback with 3 rotating user agents |
| Content validation | Minimum 100 chars |
| Retries | 2 per engine |

**Recovery chain entry point:** `extractWithRecovery()` in `src/discovery/extraction/extraction-manager.ts`

**Evidence:** `PHASE8_1_5_CRAWLER_ARCHITECTURE_AUDIT.md` — All HTTP acquisition flows through single extraction chain. First successful extraction terminates chain. All metrics recorded in SQLite `extraction_metrics` table.

### Analyzer

**Gemini Analyzer** — Normalization only. No crawling responsibility.

| Property | Value |
|----------|-------|
| File | `src/discovery/gemini-analyzer.ts` |
| API calls | NONE — heuristic analysis only |
| Input | Pre-extracted HTML, JSON-LD, network data |
| Output | Normalized product data |

**Evidence:** `PHASE8_1_5_CRAWLER_ARCHITECTURE_AUDIT.md` Section 4 — Analyzer receives pre-extracted content, never crawls.

### Explicitly NOT Used

- **Playwright crawler** — `playwright` is devDependency only (testing). Zero imports in `src/`.
- **Crawl4AI** — Zero occurrences in entire codebase.
- **Any additional crawler** — No other crawling engines exist in production code.
- **DOM libraries** (cheerio, jsdom, htmlparser2) — Not present. All HTML parsing is regex-based.
- **External crawling services** — No Scrapy, Puppeteer, or similar.

**Evidence:** `PHASE8_1_5_CRAWLER_ARCHITECTURE_AUDIT.md` Section 5 — Architecture Lock Verification table.

---

## 3. Identity Contract

### Source Identity (Research, Read-Only)

| Field | Description |
|-------|-------------|
| `sourceUrl` | The target website being reverse-engineered |
| `sourceDomain` | Domain of the target website |

**Used for:** Research, discovery, crawling, extraction.
**Never used for:** Deployment, DNS, domain binding, CMS URLs.

### Product Identity (Deployment)

| Field | Description |
|-------|-------------|
| `productDomain` | The production domain for the new website |
| `productSlug` | URL-safe slug derived from `productDomain` |

**Used for:** Deployment, GitHub folders, Vercel projects, Cloudflare DNS, CMS-generated URLs.
**Never used for:** Crawling, research, extraction.

### Rules

- **Source identity never deploys.** — `sourceUrl` and `sourceDomain` are read-only research fields.
- **Product identity never crawls.** — `productDomain` and `productSlug` are deployment-only fields.
- **Both variables remain independent.** — Target flows into discovery/extraction. Domain flows into deployment. They never cross.

**Evidence:** `PHASE8_1_PIPELINE_DRY_RUN.md` Section 2 — Independence Verification table. `PHASE7_DELIVERY_VERIFICATION.md` Section 7 — End-to-End Delivery Simulation.

---

## 4. SSOT Rule

**SQLite is the Single Source of Truth.**

| Component | Reads SQLite | Writes SQLite |
|-----------|-------------|---------------|
| Dashboard (50 pages) | Via `/api/*` routes | Via `/api/*` routes |
| CMS Generator | `site_urls`, `extracted_products`, `posts` | `cms_pages`, `cms_brands`, `cms_collections`, `cms_seo`, `cms_search_index` |
| Verification | `site_urls`, `extracted_products`, `cms_*` | `verification_reports`, `audit_reports`, `repair_reports` |
| Discovery | `site_urls` | `site_urls` |
| Extraction | `product_urls`, `extracted_products` | `extracted_products`, `media_assets`, `extraction_metrics` |

### SSOT Enforcement

- **All 28 API routes** import `db` from `@/lib/db` — zero external fetch calls.
- **All 50 dashboard pages** fetch from internal `/api/*` routes only.
- **No component may bypass SQLite.**
- **Database:** `database/site.db` (local) or `/tmp/database/site.db` (Vercel)
- **Engine:** better-sqlite3 with WAL mode
- **Tables:** 22 tables, created with `IF NOT EXISTS`
- **Seed data:** Inserted only if table is empty; `.run()` chained on every `prepare()`

**Evidence:** `PHASE6_DASHBOARD_VERIFICATION.md` — All 28 API routes verified. All 50 dashboard pages verified. Zero external dependencies.

---

## 5. Extension Policy

### New capabilities must be plugins.

**Forbidden:**

| Violation | Reason |
|-----------|--------|
| Replacing the acquisition layer | Chrome DevTools MCP is the primary engine. Replacing breaks the recovery chain. |
| Adding duplicate crawlers | Multiple crawlers create race conditions and violate the single-chain architecture. |
| Changing SQLite SSOT | All data flows through SQLite. Bypassing it breaks the dashboard, CMS, and verification. |

### Allowed

- Adding new extraction engines as additional recovery levels (after L2)
- Adding new verification checks to the verification engine
- Adding new CMS generators for new content types
- Adding new dashboard pages that read from `/api/*` routes
- Adding new API routes that read from SQLite

**Evidence:** `PHASE8_1_PIPELINE_DRY_RUN.md` Section 7 — Architecture Lock Verification. `PHASE8_1_5_CRAWLER_ARCHITECTURE_AUDIT.md` Section 5 — Architecture Lock Verification.

---

## 6. Multi-Project Isolation

### Each execution creates an isolated project:

| Parameter | Isolation Mechanism |
|-----------|---------------------|
| `Target` (sourceUrl) | Variable — different source websites |
| `Domain` (productDomain) | Variable — different production domains |
| `productSlug` | Derived from `productDomain` — unique folder name |
| SQLite | Per-deployment: own `/tmp/database/site.db` (Vercel) or `database/site.db` (local) |
| CMS data | Per-deployment: generated via `generateCms(siteUrl, identity)` |
| GitHub | Monorepo with per-customer folders (`productSlug/`) |
| Vercel | Per-customer project (`productSlug`) with own domains |
| Cloudflare | Per-customer zone (`productDomain`) with own DNS |

### Asset Isolation

- **SQLite:** Isolated per deployment
- **CMS data:** Isolated per deployment
- **Static assets:** Shared `public/images/` — acceptable since each Vercel project serves its own folder
- **Hardcoded PoC paths:** Will be replaced by CMS-generated content in production

**Evidence:** `PHASE7_DELIVERY_VERIFICATION.md` Section 6 — Asset Isolation Audit. `PHASE8_1_PIPELINE_DRY_RUN.md` Section 4 — State Management Audit.
