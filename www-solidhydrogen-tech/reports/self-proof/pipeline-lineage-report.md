# Pipeline Lineage Report

**Generated:** 2026-07-18 | **Source:** Code Audit | **Pipeline:** L1→L2→L3→L4→L5→L6→L7→L8

## Pipeline Overview

```
L1 (JCodesMore Engine)
  └→ L2 (OpenCode Execution Engine)
       └→ L3 (Extraction Manager)
            └→ L4 (Browser Extraction Layer) ←→ L5 (AI Analysis Layer)
                 └→ L6 (Data Storage Layer / SQLite)
                      └→ L7 (CMS Generation Layer)
                           └→ L8 (Delivery Pipeline)
```

## Layer-by-Layer Lineage

### Layer 1: JCodesMore Engine
- **Entry:** CLI → `jcodesmore` CLI
- **Output:** Triggers L2 execution
- **Data Flow:** CLI args → OpenCode config → L2

### Layer 2: OpenCode Execution Engine
- **Entry:** `src/lib/opencode-client.ts`
- **Output:** Task orchestration, worktree management
- **Data Flow:** Config → Task queue → L3 dispatch

### Layer 3: Extraction Manager
- **Entry:** `src/discovery/extraction-manager.ts`
- **Input Tables:** site_urls (10 rows)
- **Output Tables:** product_urls (0), extracted_products (0), media_assets (0)
- **Code Path:** `startExtraction()` → iterates site_urls WHERE status='discovered' → dispatches to L4/L5
- **Current State:** EMPTY — extraction never fully executed

### Layer 4: Browser Extraction Layer
- **Entry:** `src/discovery/extraction/jcodesmore-engine.ts`
- **Input:** site_url.url
- **Output:** page content, links, metadata
- **Fallback:** firecrawl-engine.ts → api-fallback.ts
- **Current State:** Used by L3 discovery; no standalone execution

### Layer 5: AI Analysis Layer
- **Entry:** `src/discovery/ai-analysis.ts`
- **Input:** Raw page content from L4
- **Output:** Classification, product extraction, structured data
- **Current State:** Called by L3 during extraction; results stored in L6

### Layer 6: Data Storage Layer (SQLite)
- **Entry:** `src/lib/db.ts` (schema), `src/lib/site.ts` (CRUD)
- **Tables:** 33 tables, 127 rows
- **Current State:** Mostly empty (see SQLite Integrity Report)

### Layer 7: CMS Generation Layer
- **Entry:** `src/discovery/cms/page-generator.ts`
- **Input Tables:** extracted_products (0), site_urls (10), categories (6), posts (3)
- **Output Tables:** cms_pages (18), cms_brands (0), cms_collections (0), cms_seo (18), cms_search_index (26)
- **Code Path:** `generateAll()` → page-generator + brand-generator + collection-generator + blog-generator + seo-generator + search-index-generator
- **Output Files:** `public/cms/pages.json`, `public/cms/brands.json`, `public/cms/collections.json`, `public/cms/search-index.json`
- **Current State:** 18 CMS pages generated (from seed data), no brands/collections (no extracted products)

### Layer 8: Delivery Pipeline
- **Entry:** `deployment/deploy.ts` (1,207 lines)
- **Providers:** GitHub (`deployment/providers/github.ts`), Vercel (`deployment/providers/vercel.ts`), Cloudflare (`deployment/providers/cloudflare.ts`)
- **Verification:** `deployment/verify.ts`
- **Current State:** No deployment_reports in DB (never deployed via pipeline)

## Data Lineage Trace (Current State)

```
site_urls (10 rows)
  ├→ product_urls (0 rows) — extraction not run
  │    └→ extracted_products (0 rows)
  │         ├→ media_assets (0 rows)
  │         ├→ cms_pages (0 rows from products)
  │         ├→ cms_brands (0 rows)
  │         ├→ cms_collections (0 rows)
  │         └→ cms_seo (0 rows from products)
  └→ (direct CMS generation from seed data)
       ├→ cms_pages (18 rows — from categories/posts/settings)
       ├→ cms_seo (18 rows — from pages)
       └→ cms_search_index (26 rows — from pages)

categories (6 rows) ─→ cms_pages (homepage/about/contact/blog/category)
posts (3 rows) ─→ cms_pages (blog posts)
settings (1 row) ─→ cms_pages (global)
navigation (18 rows) ─→ public CMS files
hero (1 row) ─→ public/cms/hero.json
benefits (11 rows) ─→ public/cms/benefits.json
team_members (2 rows) ─→ public/cms/team.json
```

## Pipeline Gaps

| Gap | Location | Impact |
|-----|----------|--------|
| Extraction never ran | L3 → L4/L5 | No products discovered or extracted |
| No brands generated | L7 brand-generator | Depends on extracted_products |
| No collections generated | L7 collection-generator | Depends on extracted_products |
| No deployment executed | L8 deploy.ts | No deployment_reports |
| FK enforcement off | L6 db.ts | Orphan rows possible on delete |
| Firecrawl can become primary | L3 engine priority | Violates architecture lock |
| 10 duplicate indexes | L6 schema | Minor write overhead |
| 13 high-NULL columns | L6/L7 | SEO/OG data sparse |

## Code Module Map

| Layer | Module | Lines | Exports |
|-------|--------|-------|---------|
| L3 | extraction-manager.ts | ~400 | 10 functions |
| L3 | extraction-with-recovery.ts | ~200 | 3 functions |
| L3 | output-generator.ts | ~150 | 3 functions |
| L4 | jcodesmore-engine.ts | ~300 | 5 functions |
| L4 | firecrawl-engine.ts | ~200 | 3 functions |
| L5 | ai-analysis.ts | ~500 | 8 functions |
| L6 | db.ts | ~600 | 15 functions |
| L6 | site.ts | ~800 | 30+ functions |
| L7 | page-generator.ts | ~200 | 3 functions |
| L7 | brand-generator.ts | ~100 | 2 functions |
| L7 | collection-generator.ts | ~100 | 2 functions |
| L7 | blog-generator.ts | ~100 | 2 functions |
| L7 | seo-generator.ts | ~150 | 3 functions |
| L7 | search-index-generator.ts | ~100 | 2 functions |
| L7 | cms-quality-validator.ts | ~200 | 5 functions |
| L7 | cms-output-generator.ts | ~150 | 3 functions |
| L8 | deploy.ts | 1,207 | 15+ functions |
| L8 | verify.ts | ~300 | 5 functions |
| L8 | github.ts | ~200 | 5 functions |
| L8 | vercel.ts | ~200 | 5 functions |
| L8 | cloudflare.ts | ~200 | 5 functions |

## Conclusion

Pipeline structure is complete across all 8 layers. The critical gap is that **extraction (L3→L4→L5) has never been fully executed** — site_urls were discovered (10 rows) but no products were extracted. CMS generation (L7) produced 18 pages from seed data (categories, posts, settings) but 0 brands/collections (which depend on extracted products). Delivery (L8) has never been executed. The pipeline is structurally sound but operationally dormant.
