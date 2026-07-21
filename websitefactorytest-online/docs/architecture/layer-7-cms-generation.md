# Layer 7 — CMS Generation Layer

## Overview

Layer 7 transforms upstream extraction data into a complete CMS structure: pages, brands, collections, blog posts, SEO metadata, search indexes, navigation, and sitemaps. It writes results to 5 SQLite tables and produces 4 JSON output files.

## Architecture Boundary

### Layer 7 Owns

- CMS Page Generation
- Product Page Generation
- Brand Generation
- Category/Collection Generation
- Blog Post Generation
- Navigation Generation
- Menu Generation
- Search Index Generation
- SEO Metadata Generation
- Internal Link Generation
- Schema/Structured Data Generation
- CMS Output Packaging (manifest, sitemap, navigation JSON)

### Layer 7 MUST NOT Own

- Browser Extraction (Layer 4)
- Chrome DevTools MCP (Layer 4)
- JCodesMore Recovery (Layer 4)
- Firecrawl Recovery (Layer 4)
- Gemini Analysis (Layer 5)
- SQLite Runtime (Layer 6)
- Dashboard Runtime (Next.js)
- Deployment (GitHub → Vercel → Cloudflare)

## Responsibilities

| ID | Responsibility | Status | Description |
|----|---------------|--------|-------------|
| R1 | Page Generation | Complete | Generate CMS pages from site_urls and extracted_products |
| R2 | Brand Generation | Complete | Extract unique brands from products, generate brand entries |
| R3 | Collection Generation | Complete | Group products by category into collections |
| R4 | Blog Generation | Complete | Convert posts table entries to CMS blog pages |
| R5 | SEO Generation | Complete | Generate SEO metadata for all CMS entities |
| R6 | Search Index Generation | Complete | Build full-text search index across all entity types |
| R7 | Navigation Generation | Complete | Generate hierarchical navigation structures |
| R8 | Schema Generation | Partial | Carry forward structured data from extraction (no standalone generator) |
| R9 | Internal Link Validation | Partial | Validate internal links in quality validator (no standalone generator) |
| R10 | Output Packaging | Complete | Generate manifest, sitemap, navigation JSON files |
| R11 | Quality Validation | Complete | Validate CMS data quality and completeness |
| R12 | CMS Output Delivery | Complete | Write output files to docs/discovery/ |
| R13 | Incremental Generation | Missing | No support for incremental/partial regeneration |

## Inputs

| Source | Layer | Data |
|--------|-------|------|
| site_urls table | Layer 4 (Discovery) | Discovered pages with metadata |
| extracted_products table | Layer 4 (Extraction) | Product data with SEO, schema, images |
| posts table | Layer 6 (Seed Data) | Blog post content |
| categories table | Layer 6 (Seed Data) | Category hierarchy |

## Outputs

### SQLite Tables (5)

| Table | Columns | Indexes |
|-------|---------|---------|
| cms_pages | 18 columns (url UNIQUE, slug, title, description, page_type, source_table, source_id, meta_*, og_*, canonical, schema_json, status) | 3 indexes |
| cms_brands | 7 columns (name, slug UNIQUE, logo_url, description, product_count) | 1 index |
| cms_collections | 8 columns (name, slug UNIQUE, description, image_url, product_count, products_json) | 1 index |
| cms_seo | 14 columns (url UNIQUE, slug, page_type, entity_type, entity_id, meta_*, og_*, canonical, schema_json) | 2 indexes |
| cms_search_index | 9 columns (entity_type, entity_id, title, description, keywords, url, image_url, category) | 2 indexes |

### JSON Output Files (4)

| File | Path | Content |
|------|------|---------|
| website-manifest.json | docs/discovery/ | Pages, brands, collections, categories, blog posts |
| search-index.json | docs/discovery/ | Full-text search entries |
| navigation.json | docs/discovery/ | Main nav + footer nav hierarchical structure |
| sitemap.xml + sitemap.json | docs/discovery/ | URL priority scoring, changefreq |

## Execution Flow

```
generateCms(siteUrl)
  ├── Phase 1: generatePages(siteUrl)
  │     ├── Read site_urls table
  │     ├── Map page types → CMS page types
  │     ├── Read extracted_products table
  │     ├── Generate product detail pages
  │     └── Write to cms_pages (INSERT OR REPLACE)
  │
  ├── Phase 2: generateBrands(siteUrl)
  │     ├── Read extracted_products (distinct brands)
  │     ├── Group by brand name
  │     ├── Count products per brand
  │     └── Write to cms_brands
  │
  ├── Phase 3: generateCollections(siteUrl)
  │     ├── Read extracted_products (distinct categories)
  │     ├── Group by category
  │     ├── Create "All Products" collection
  │     └── Write to cms_collections
  │
  ├── Phase 4: generateBlogPosts(siteUrl)
  │     ├── Read posts table
  │     ├── Check existing cms_pages
  │     ├── Insert/update blog-post pages
  │     └── Write to cms_pages
  │
  ├── Phase 5: generateSeoMetadata(siteUrl)
  │     ├── Read all cms_pages
  │     ├── Generate SEO entries per page
  │     └── Write to cms_seo
  │
  ├── Phase 6: generateSearchIndex(siteUrl)
  │     ├── Read pages, products, brands, collections, blog
  │     ├── Assemble keywords per entity
  │     └── Write to cms_search_index
  │
  ├── Phase 7: Output Files
  │     ├── generateCmsManifest() → website-manifest.json
  │     ├── generateCmsSearchOutput() → search-index.json
  │     ├── generateCmsNavigation() → navigation.json
  │     └── generateCmsSitemap() → sitemap.xml + sitemap.json
  │
  └── Phase 8: validateCmsQuality()
        ├── Check metadata completeness
        ├── Check SEO coverage
        ├── Check for duplicate slugs
        ├── Check for broken internal links
        └── Return CmsQualityResult
```

## Data Flow

```
Layer 4 (Discovery)          Layer 5 (Analysis)         Layer 7 (CMS)
  site_urls ──────────────────────────────────────────→ page-generator
  product_urls ───────────────────────────────────────→ page-generator
  extracted_products ────────→ (normalized) ──────────→ page-generator
  extracted_products ─────────────────────────────────→ brand-generator
  extracted_products ─────────────────────────────────→ collection-generator
  json_ld/schema ────────────────────────────────────→ seo-generator

Layer 6 (Storage)
  posts ──────────────────────────────────────────────→ blog-generator
  categories ─────────────────────────────────────────→ collection-generator

Layer 7 → Layer 6 (Storage)
  cms_pages ←───────────────────────────────────────── write
  cms_brands ←──────────────────────────────────────── write
  cms_collections ←─────────────────────────────────── write
  cms_seo ←─────────────────────────────────────────── write
  cms_search_index ←────────────────────────────────── write

Layer 7 → Output
  website-manifest.json ←───────────────────────────── write
  search-index.json ←───────────────────────────────── write
  navigation.json ←─────────────────────────────────── write
  sitemap.xml + sitemap.json ←──────────────────────── write
```

## Interaction with Layer 6

Layer 7 reads from and writes to SQLite through Layer 6:

| Operation | Table | Pattern |
|-----------|-------|---------|
| Read | site_urls | SELECT with filters |
| Read | extracted_products | SELECT with filters |
| Read | posts | SELECT all |
| Read | categories | SELECT all |
| Read | cms_pages | SELECT for validation |
| Write | cms_pages | INSERT OR REPLACE |
| Write | cms_brands | DELETE all + INSERT |
| Write | cms_collections | DELETE all + INSERT |
| Write | cms_seo | DELETE all + INSERT |
| Write | cms_search_index | DELETE all + INSERT |

## Interaction with Layer 8 (Deployment)

Layer 7 produces output files that Layer 8 packages for deployment:

| Output | Layer 8 Usage |
|--------|---------------|
| website-manifest.json | Included in build output |
| search-index.json | Included in build output |
| navigation.json | Used for navigation rendering |
| sitemap.xml | Deployed to site root |

## Policy Usage

| Policy | Status | Usage |
|--------|--------|-------|
| sqlite-policy.json | Not Used | CMS generators use raw db.prepare() calls |
| storage-policy.json | Not Used | No abstraction layer for storage operations |
| transaction-policy.json | Not Used | No transaction wrapping (individual writes) |
| backup-policy.json | Not Used | No backup before CMS generation |
| integrity-policy.json | Not Used | No integrity checks before/after generation |
| migration-policy.json | Not Used | No migration involvement |

## Workflow Usage

| Workflow | Status | Usage |
|----------|--------|-------|
| storage-workflow.json | Not Used | CMS generators bypass workflow |
| backup-workflow.json | Not Used | No backup workflow |
| recovery-workflow.json | Not Used | No recovery workflow |

## Failure Handling

| Failure Type | Current Handling | Gap |
|-------------|-----------------|-----|
| Database write failure | Unhandled (throws) | No retry, no transaction |
| Duplicate slug collision | INSERT OR REPLACE handles | No conflict resolution strategy |
| Missing upstream data | Skips silently | No warning, no partial result |
| Output file write failure | Unhandled (throws) | No recovery, no partial output |
| Quality validation failure | Returns issues, no action | No auto-fix, no blocking |

## Recovery

| Scenario | Current Recovery | Gap |
|----------|-----------------|-----|
| CMS generation fails mid-way | No recovery | Partial data remains in DB |
| Output files corrupted | Re-generate from DB | No backup of previous output |
| Database corruption | Layer 6 recovery | No CMS-specific recovery |
| Schema mismatch | Schema from db.ts handles | No CMS-specific migration |

## Implementation Files

### Core Engine (8 files, ~1,001 lines)

| File | Lines | Purpose |
|------|-------|---------|
| src/discovery/cms/cms-generator-engine.ts | 107 | Master orchestrator (8 phases) |
| src/discovery/cms/page-generator.ts | 136 | Page generation from site_urls + products |
| src/discovery/cms/brand-generator.ts | 65 | Brand extraction and generation |
| src/discovery/cms/collection-generator.ts | 69 | Collection grouping by category |
| src/discovery/cms/blog-generator.ts | 89 | Blog post conversion |
| src/discovery/cms/seo-generator.ts | 57 | SEO metadata generation |
| src/discovery/cms/search-index-generator.ts | 94 | Full-text search index |
| src/discovery/cms/cms-quality-validator.ts | 154 | Quality validation (5 checks) |
| src/discovery/cms/cms-output-generator.ts | 263 | Output file generation (4 files) |
| src/discovery/cms/index.ts | 20 | Barrel export |

### API Route (1 file, 101 lines)

| File | Lines | Purpose |
|------|-------|---------|
| src/app/api/cms-generator/route.ts | 101 | GET (read state) + POST (trigger generation) |

### Dashboard Components (8 files, 826 lines)

| File | Lines | Purpose |
|------|-------|---------|
| src/app/dashboard/cms-generator/page.tsx | 177 | Main dashboard UI |
| src/app/dashboard/cms-generator/pages/page.tsx | 97 | Pages viewer |
| src/app/dashboard/cms-generator/brands/page.tsx | 75 | Brands viewer |
| src/app/dashboard/cms-generator/collections/page.tsx | 84 | Collections viewer |
| src/app/dashboard/cms-generator/blog/page.tsx | 72 | Blog viewer |
| src/app/dashboard/cms-generator/seo/page.tsx | 95 | SEO viewer |
| src/app/dashboard/cms-generator/search/page.tsx | 103 | Search index viewer |
| src/app/dashboard/cms-generator/quality/page.tsx | 123 | Quality report viewer |

### Types (1 file, ~252 lines)

| File | Lines | Purpose |
|------|-------|---------|
| src/types/discovery.ts (CMS section) | ~252 | 22 CMS-related type definitions |

### Scripts (1 file, 334 lines)

| File | Lines | Purpose |
|------|-------|---------|
| scripts/research-importer.mjs | 334 | Phase 4.5 fallback importer |

### Database Schema (1 file, ~87 lines)

| File | Lines | Purpose |
|------|-------|---------|
| src/lib/db.ts (CMS tables) | ~87 | 5 tables, 9 indexes |

## Total Codebase

| Category | Files | Lines |
|----------|-------|-------|
| Core Engine | 10 | 1,001 |
| API Route | 1 | 101 |
| Dashboard | 8 | 826 |
| Types | 1 | ~252 |
| Scripts | 1 | 334 |
| DB Schema | 1 | ~87 |
| **Total** | **22** | **~2,601** |
