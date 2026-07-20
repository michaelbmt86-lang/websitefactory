# Layer 6 — Data Storage Layer (SQLite)

## Layer Name

**Layer 6 — Data Storage Layer (SQLite)**

## Primary Purpose

Layer 6 Data Storage Layer is the persistence and data management subsystem of the Website Factory pipeline. It owns ALL data storage: receiving structured data from upstream layers, validating schemas, normalizing records, upserting into SQLite, maintaining relationships, indexes, transactions, integrity, version history, providing query services, generating statistics, producing storage reports, and returning execution status.

SQLite is the **Single Source of Truth**. All layers read/write through Layer 6. No secondary database, no duplicated storage, no CMS-owned storage, no Dashboard-owned storage.

---

## Critical Constraint

**SQLite is Single Source of Truth.** No other database. No in-memory caching as source. No file-based storage as primary. All structured data lives in SQLite tables. All layers must read/write through Layer 6.

---

## Storage Priority Chain

```
Layer 5 Output (Normalized JSON, Component JSON, CMS JSON, SEO JSON, Media JSON)
    │
    ▼
Layer 6 Storage
    ├─ Receive Structured Data (R1)
    ├─ Validate Schema (R2)
    ├─ Normalize Records (R3)
    ├─ UPSERT Records (R4)
    ├─ Maintain Relationships (R5)
    ├─ Maintain Indexes (R6)
    ├─ Maintain Transactions (R7)
    ├─ Maintain Integrity (R8)
    ├─ Maintain Version History (R9)
    ├─ Provide Query Services (R10)
    ├─ Provide Statistics (R11)
    ├─ Generate Storage Reports (R12)
    └─ Return Execution Status (R13)
```

---

## Responsibilities

### R1. Receive Structured Data

| Attribute | Detail |
|---|---|
| **Purpose** | Accept structured data from upstream layers (Layer 3 extraction, Layer 5 analysis, CMS generation, verification) |
| **Input** | Normalized JSON, component JSON, CMS JSON, SEO JSON, media JSON, verification JSON |
| **Output** | Validated data objects ready for storage |
| **Dependencies** | All upstream layers |
| **Failure Behaviour** | Reject malformed data; return validation error |

### R2. Validate Schema

| Attribute | Detail |
|---|---|
| **Purpose** | Validate incoming data against expected table schemas — check required fields, types, constraints |
| **Input** | Raw data objects from upstream layers |
| **Output** | Validated data or validation errors |
| **Dependencies** | Schema definitions in `src/lib/db.ts` |
| **Failure Behaviour** | Return validation errors; skip invalid records; log issues |

### R3. Normalize Records

| Attribute | Detail |
|---|---|
| **Purpose** | Normalize data for storage — trim strings, normalize URLs, compute slugs, set defaults, cast types |
| **Input** | Validated data objects |
| **Output** | Storage-ready records |
| **Dependencies** | Schema defaults, normalization rules |
| **Failure Behaviour** | Apply defaults where possible; log normalization failures |

### R4. UPSERT Records

| Attribute | Detail |
|---|---|
| **Purpose** | Insert new records or update existing ones — handle conflicts, deduplication, status updates |
| **Input** | Storage-ready records |
| **Output** | Inserted/updated record IDs |
| **Dependencies** | SQLite UPSERT logic, unique constraints |
| **Failure Behaviour** | Retry on transient errors; log permanent failures; return error status |

### R5. Maintain Relationships

| Attribute | Detail |
|---|---|
| **Purpose** | Maintain foreign key relationships between tables — parent-child, product-media, page-seo |
| **Input** | Related records |
| **Output** | Updated relationship references |
| **Dependencies** | Foreign key constraints in schema |
| **Failure Behaviour** | Log orphaned references; continue with available data |

### R6. Maintain Indexes

| Attribute | Detail |
|---|---|
| **Purpose** | Maintain database indexes for query performance — 27 indexes across 10 tables |
| **Input** | Schema index definitions |
| **Output** | Optimized query performance |
| **Dependencies** | Index definitions in `src/lib/db.ts` |
| **Failure Behaviour** | Log index creation failures; continue without index |

### R7. Maintain Transactions

| Attribute | Detail |
|---|---|
| **Purpose** | Wrap multi-statement operations in transactions for atomicity and consistency |
| **Input** | Multi-statement operations |
| **Output** | Atomic commit or rollback |
| **Dependencies** | SQLite transaction support |
| **Failure Behaviour** | Rollback on error; log transaction failures |

### R8. Maintain Integrity

| Attribute | Detail |
|---|---|
| **Purpose** | Ensure data integrity — enforce constraints, prevent orphaned records, validate referential integrity |
| **Input** | All database operations |
| **Output** | Consistent, valid data state |
| **Dependencies** | UNIQUE, NOT NULL, DEFAULT, PRIMARY KEY constraints |
| **Failure Behaviour** | Reject integrity violations; log constraint errors |

### R9. Maintain Version History

| Attribute | Detail |
|---|---|
| **Purpose** | Track schema changes and data versioning — ALTER TABLE migrations, schema versioning |
| **Input** | Schema change requests |
| **Output** | Updated schema with version tracking |
| **Dependencies** | Migration logic in `src/lib/db.ts` |
| **Failure Behaviour** | Attempt migration; rollback on failure; log migration errors |

### R10. Provide Query Services

| Attribute | Detail |
|---|---|
| **Purpose** | Provide read query services — CRUD operations, filtering, pagination, search |
| **Input** | Query parameters |
| **Output** | Query results |
| **Dependencies** | SQLite query engine, indexes |
| **Failure Behaviour** | Return empty results on error; log query failures |

### R11. Provide Statistics

| Attribute | Detail |
|---|---|
| **Purpose** | Compute and return database statistics — record counts, aggregates, health metrics |
| **Input** | Table names, query parameters |
| **Output** | Statistics objects |
| **Dependencies** | Aggregate SQL queries |
| **Failure Behaviour** | Return partial statistics; log computation failures |

### R12. Generate Storage Reports

| Attribute | Detail |
|---|---|
| **Purpose** | Generate storage health reports — table sizes, index usage, integrity checks, performance metrics |
| **Input** | Database metadata |
| **Output** | Storage report objects |
| **Dependencies** | SQLite metadata queries |
| **Failure Behaviour** | Generate partial report; log generation failures |

### R13. Return Execution Status

| Attribute | Detail |
|---|---|
| **Purpose** | Return structured storage status — operation results, error counts, performance metrics |
| **Input** | Operation results |
| **Output** | Status response objects |
| **Dependencies** | All R1-R12 outputs |
| **Failure Behaviour** | Return partial status if some metrics unavailable |

---

## Inputs

| Input | Source | Description |
|---|---|---|
| Extracted Products | Layer 3/5 | Normalized product data from extraction pipeline |
| Site URLs | Layer 3 | Discovered site URLs from crawl |
| Product URLs | Layer 3 | Discovered product URLs |
| Media Assets | Layer 4/5 | Images, videos, downloads |
| CMS Pages | Layer 5 | Generated CMS pages |
| CMS Brands | Layer 5 | Generated CMS brands |
| CMS Collections | Layer 5 | Generated CMS collections |
| CMS Blog Posts | Layer 5 | Generated blog posts |
| CMS SEO | Layer 5 | Generated SEO metadata |
| CMS Search Index | Layer 5 | Generated search index |
| Verification Reports | Verification pipeline | Deployment/quality verification |
| Audit Reports | Audit pipeline | Codebase audit results |
| Repair Reports | Repair pipeline | Automated repair actions |
| Deployment Reports | Deployment pipeline | Deployment status |
| Extraction Metrics | Extraction pipeline | Engine performance metrics |

## Outputs

| Output | Consumer | Description |
|---|---|---|
| Query Results | All Layers | CRUD operations, filtered data |
| Statistics | Dashboard, APIs | Record counts, aggregates |
| Storage Reports | Dashboard | Health, performance, integrity |
| Execution Status | All Layers | Operation results, errors |

---

## Data Flow

```
Layer 3 (Extraction Manager) ──→ site_urls, product_urls, extracted_products
Layer 4 (Browser Extraction) ──→ media_assets, extraction_metrics
Layer 5 (AI Analysis) ──→ extracted_products (normalized), media_assets
Layer 5 CMS ──→ cms_pages, cms_brands, cms_collections, cms_seo, cms_search_index
Verification ──→ verification_reports, audit_reports, repair_reports, deployment_reports
    │
    ▼
Layer 6 (Data Storage)
    │
    ├─ R1: Receive Data → R2: Validate Schema → R3: Normalize Records
    │
    ├─ R4: UPSERT Records
    │   ├─ site_urls: INSERT OR REPLACE on url conflict
    │   ├─ product_urls: INSERT OR REPLACE on url conflict
    │   ├─ extracted_products: Manual SELECT then INSERT/UPDATE
    │   ├─ media_assets: INSERT OR IGNORE on hash conflict
    │   ├─ cms_pages: INSERT OR REPLACE on url conflict
    │   ├─ cms_brands: INSERT OR REPLACE on slug conflict
    │   ├─ cms_collections: INSERT OR REPLACE on slug conflict
    │   ├─ cms_seo: INSERT OR REPLACE on url conflict
    │   └─ cms_search_index: INSERT OR REPLACE on entity
    │
    ├─ R5: Maintain Relationships
    │   ├─ products.category_id → categories.id
    │   ├─ categories.parent_id → categories.id
    │   ├─ navigation.parent_id → navigation.id
    │   └─ media_assets.product_id → extracted_products.id
    │
    ├─ R6: Maintain Indexes (27 indexes across 10 tables)
    │
    ├─ R7: Maintain Transactions (currently only team update)
    │
    ├─ R8: Maintain Integrity (UNIQUE, NOT NULL, DEFAULT, PK constraints)
    │
    ├─ R9: Maintain Version History (ALTER TABLE with try/catch)
    │
    ├─ R10: Provide Query Services (CRUD via src/lib/site.ts)
    │
    ├─ R11: Provide Statistics (COUNT, GROUP BY queries)
    │
    ├─ R12: Generate Storage Reports (table sizes, health)
    │
    └─ R13: Return Execution Status
        └─ To all consuming layers
```

---

## Tables (23)

| Table | Purpose | Created By |
|---|---|---|
| `products` | Product catalog | `src/lib/db.ts` |
| `categories` | Product categories | `src/lib/db.ts` |
| `navigation` | Site navigation | `src/lib/db.ts` |
| `pages` | CMS pages | `src/lib/db.ts` |
| `settings` | Site settings (singleton) | `src/lib/db.ts` |
| `media` | Uploaded media files | `src/lib/db.ts` |
| `users` | User accounts | `src/lib/db.ts` |
| `posts` | Blog posts | `src/lib/db.ts` |
| `logs` | Audit logs | `src/lib/db.ts` |
| `site_urls` | Discovered site URLs | `src/lib/db.ts` |
| `product_urls` | Discovered product URLs | `src/lib/db.ts` |
| `extracted_products` | Extracted product data | `src/lib/db.ts` |
| `media_assets` | Extracted media assets | `src/lib/db.ts` |
| `cms_pages` | Generated CMS pages | `src/lib/db.ts` |
| `cms_brands` | Generated CMS brands | `src/lib/db.ts` |
| `cms_collections` | Generated CMS collections | `src/lib/db.ts` |
| `cms_seo` | Generated SEO metadata | `src/lib/db.ts` |
| `cms_search_index` | Search index | `src/lib/db.ts` |
| `verification_reports` | Verification results | `src/lib/db.ts` |
| `audit_reports` | Audit results | `src/lib/db.ts` |
| `repair_reports` | Repair results | `src/lib/db.ts` |
| `deployment_reports` | Deployment results | `src/lib/db.ts` |
| `extraction_metrics` | Engine performance | `src/lib/db.ts` |

---

## Indexes (27)

| Index | Table | Column(s) |
|---|---|---|
| `idx_site_urls_slug` | site_urls | slug |
| `idx_site_urls_page_type` | site_urls | page_type |
| `idx_site_urls_status` | site_urls | status |
| `idx_site_urls_depth` | site_urls | depth |
| `idx_site_urls_parent_url` | site_urls | parent_url |
| `idx_product_urls_category` | product_urls | category |
| `idx_product_urls_status` | product_urls | status |
| `idx_product_urls_product_slug` | product_urls | product_slug |
| `idx_product_urls_source_page` | product_urls | source_page |
| `idx_product_urls_is_duplicate` | product_urls | is_duplicate |
| `idx_extracted_products_slug` | extracted_products | slug |
| `idx_extracted_products_status` | extracted_products | status |
| `idx_extracted_products_category` | extracted_products | category |
| `idx_media_assets_product_id` | media_assets | product_id |
| `idx_media_assets_type` | media_assets | type |
| `idx_cms_pages_slug` | cms_pages | slug |
| `idx_cms_pages_page_type` | cms_pages | page_type |
| `idx_cms_pages_status` | cms_pages | status |
| `idx_cms_brands_slug` | cms_brands | slug |
| `idx_cms_collections_slug` | cms_collections | slug |
| `idx_cms_seo_slug` | cms_seo | slug |
| `idx_cms_seo_entity_type` | cms_seo | entity_type |
| `idx_cms_search_entity_type` | cms_search_index | entity_type |
| `idx_cms_search_title` | cms_search_index | title |
| `idx_extraction_metrics_url` | extraction_metrics | url |
| `idx_extraction_metrics_status` | extraction_metrics | status |
| `idx_extraction_metrics_successful_engine` | extraction_metrics | successful_engine |

---

## Foreign Keys (4)

| Table | Column | References | Enforced |
|---|---|---|---|
| `products` | category_id | `categories(id)` | ❌ No (PRAGMA foreign_keys not set) |
| `categories` | parent_id | `categories(id)` | ❌ No |
| `navigation` | parent_id | `navigation(id)` | ❌ No |
| `media_assets` | product_id | `extracted_products(id)` | ❌ No |

---

## Policy Usage

| Policy | Used By | Enforcement |
|---|---|---|
| Architecture Lock | All R1-R13 | SQLite is Single Source of Truth |
| Quality Policy | R2 Schema Validation | Data quality thresholds |
| Extraction Policy | R4 UPSERT | Extraction data storage rules |

---

## Recovery Capability

| Scenario | Behaviour |
|---|---|
| Vercel cold start | Reinitialize from seed data; ephemeral `/tmp` path |
| Schema migration | ALTER TABLE with try/catch; swallow "column exists" errors |
| Duplicate key | INSERT OR REPLACE or manual SELECT-then-UPDATE |
| Corrupted DB | No recovery logic — app continues with broken DB |
| Data loss | No backup logic — seed data re-inserted on empty tables |

---

## Implementation Files

| File | Purpose |
|---|---|
| `src/lib/db.ts` | Database initialization, schema, indexes, migrations |
| `src/lib/site.ts` | CRUD operations for core tables |
| `src/lib/auth.ts` | User authentication queries |
| `src/discovery/detail-extraction-engine.ts` | Extraction data storage |
| `src/discovery/extraction-with-recovery.ts` | Recovery extraction storage |
| `src/discovery/product-discovery-engine.ts` | Discovery data storage |
| `src/discovery/output-generator.ts` | Output generation queries |
| `src/discovery/product-output-generator.ts` | Product output queries |
| `src/discovery/quality-validator.ts` | Quality validation queries |
| `src/discovery/media-extractor.ts` | Media asset storage |
| `src/discovery/cms/page-generator.ts` | CMS page storage |
| `src/discovery/cms/brand-generator.ts` | CMS brand storage |
| `src/discovery/cms/collection-generator.ts` | CMS collection storage |
| `src/discovery/cms/seo-generator.ts` | SEO metadata storage |
| `src/discovery/cms/search-index-generator.ts` | Search index storage |
| `src/discovery/cms/blog-generator.ts` | Blog post storage |
| `src/discovery/cms/cms-output-generator.ts` | CMS output queries |
| `src/discovery/cms/cms-quality-validator.ts` | CMS quality queries |
| `src/discovery/verification/sqlite-verifier.ts` | SQLite verification |
| `src/discovery/verification/verification-engine.ts` | Verification storage |
| `src/discovery/verification/repair-engine.ts` | Repair storage |
| `src/discovery/verification/audit-engine.ts` | Audit storage |
| `scripts/init-db.ts` | Legacy DB initialization (unused by main app) |
| `scripts/seed.ts` | Legacy seed script (unused by main app) |

---

## Layer Boundary Constraints

| Constraint | Rule |
|---|---|
| **Layer 6 does NOT crawl websites** | All crawling is Layer 3/4 responsibility |
| **Layer 6 does NOT perform browser automation** | All browser work is Layer 4 responsibility |
| **Layer 6 does NOT perform AI analysis** | All analysis is Layer 5 responsibility |
| **Layer 6 does NOT generate CMS** | CMS generation is Layer 5 responsibility |
| **Layer 6 does NOT perform deployment** | Deployment is Layer 2 responsibility |
| **Layer 6 DOES store data** | SQLite is Single Source of Truth |
| **Layer 6 DOES validate schemas** | Schema validation on write |
| **Layer 6 DOES normalize records** | Data normalization for storage |
| **Layer 6 DOES upsert records** | Insert or update on conflict |
| **Layer 6 DOES maintain relationships** | Foreign key references |
| **Layer 6 DOES maintain indexes** | 27 indexes for query performance |
| **Layer 6 DOES maintain transactions** | Atomic multi-statement operations |
| **Layer 6 DOES maintain integrity** | Constraint enforcement |
| **Layer 6 DOES maintain version history** | Schema migration tracking |
| **Layer 6 DOES provide queries** | CRUD operations for all layers |
| **Layer 6 DOES provide statistics** | Record counts, aggregates |
| **Layer 6 DOES generate reports** | Storage health reports |
| **Layer 6 DOES return status** | Operation results and errors |
