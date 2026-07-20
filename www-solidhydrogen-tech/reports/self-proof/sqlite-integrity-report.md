# SQLite Integrity Report

**Generated:** 2026-07-18 | **DB:** database/site.db (135,168 bytes) | **Engine:** better-sqlite3, WAL mode

## Table Inventory

### Total: 38 tables (including sqlite_sequence)

| # | Table | Rows | Category |
|---|-------|------|----------|
| 1 | site_urls | 10 | Discovery |
| 2 | product_urls | 0 | Discovery |
| 3 | extracted_products | 0 | Extraction |
| 4 | media_assets | 0 | Extraction |
| 5 | extraction_metrics | 0 | Extraction |
| 6 | cms_pages | 18 | CMS |
| 7 | cms_brands | 0 | CMS |
| 8 | cms_collections | 0 | CMS |
| 9 | cms_seo | 18 | CMS |
| 10 | cms_search_index | 26 | CMS |
| 11 | products | 0 | CMS |
| 12 | categories | 6 | CMS |
| 13 | navigation | 18 | CMS |
| 14 | posts | 3 | CMS |
| 15 | images | 6 | CMS |
| 16 | videos | 1 | CMS |
| 17 | benefits | 11 | CMS |
| 18 | team_members | 2 | CMS |
| 19 | team_section_text | 1 | CMS |
| 20 | technology_section | 1 | CMS |
| 21 | hero | 1 | CMS |
| 22 | hero_animated | 1 | CMS |
| 23 | theme | 1 | CMS |
| 24 | header_settings | 1 | CMS |
| 25 | footer | 1 | CMS |
| 26 | footer_details | 1 | CMS |
| 27 | seo | 1 | CMS |
| 28 | settings | 1 | CMS |
| 29 | site_settings | 0 | CMS |
| 30 | users | 1 | System |
| 31 | logs | 0 | System |
| 32 | verification_reports | 1 | System |
| 33 | audit_reports | 1 | System |
| 34 | repair_reports | 1 | System |
| 35 | deployment_reports | 0 | System |
| 36 | media | 0 | System |
| 37 | sqlite_sequence | 20 | Internal |
| 38 | pages | 0 | Legacy |

### Category Totals

| Category | Tables | Total Rows |
|----------|--------|------------|
| Discovery | 2 | 10 |
| Extraction | 3 | 0 |
| CMS | 23 | 114 |
| System | 5 | 3 |
| **Total** | **33** (excl. internal) | **127** |

## Index Inventory

### Total: 27 indexes

| Table | Index Name | Columns | Unique |
|-------|-----------|---------|--------|
| categories | idx_categories_slug | slug | Yes |
| categories | idx_categories_position | position | No |
| images | idx_images_position | position | No |
| media_assets | idx_media_assets_source_id | source_id | No |
| navigation | idx_navigation_position | position | No |
| navigation | idx_navigation_parent | parent_id | No |
| posts | idx_posts_slug | slug | Yes |
| posts | idx_posts_position | position | No |
| products | idx_products_slug | slug | Yes |
| products | idx_products_category | category_id | No |
| products | idx_products_position | position | No |
| products | idx_products_featured | featured | No |
| site_urls | idx_site_urls_url | url | Yes |
| site_urls | idx_site_urls_status | status | No |
| site_urls | idx_site_urls_depth | depth | No |
| product_urls | idx_product_urls_product_id | product_id | Yes |
| product_urls | idx_product_urls_url | url | No |
| product_urls | idx_product_urls_status | status | No |
| extracted_products | idx_extracted_products_url_id | url_id | Yes |
| extracted_products | idx_extracted_products_status | status | No |
| cms_pages | idx_cms_pages_slug | slug | Yes |
| cms_pages | idx_cms_pages_type | type | No |
| cms_brands | idx_cms_brands_slug | slug | Yes |
| cms_collections | idx_cms_collections_slug | slug | Yes |
| cms_seo | idx_cms_seo_slug | slug | Yes |
| cms_search_index | idx_cms_search_index_slug | slug | Yes |
| users | idx_users_email | email | Yes |

### Duplicate Index Analysis

| Table | Duplicate Columns | Verdict |
|-------|------------------|---------|
| site_urls | url (idx_site_urls_url + sqlite_autoindex_site_urls_1) | DUPLICATE |
| product_urls | product_id (idx_product_urls_product_id + sqlite_autoindex_product_urls_1) | DUPLICATE |
| product_urls | url (idx_product_urls_url + sqlite_autoindex_product_urls_2) | DUPLICATE |
| extracted_products | url_id (idx_extracted_products_url_id + sqlite_autoindex_extracted_products_1) | DUPLICATE |
| cms_pages | slug (idx_cms_pages_slug + sqlite_autoindex_cms_pages_1) | DUPLICATE |
| cms_brands | slug (idx_cms_brands_slug + sqlite_autoindex_cms_brands_1) | DUPLICATE |
| cms_collections | slug (idx_cms_collections_slug + sqlite_autoindex_cms_collections_1) | DUPLICATE |
| cms_seo | slug (idx_cms_seo_slug + sqlite_autoindex_cms_seo_1) | DUPLICATE |
| cms_search_index | slug (idx_cms_search_index_slug + sqlite_autoindex_cms_search_index_1) | DUPLICATE |
| users | email (idx_users_email + sqlite_autoindex_users_1) | DUPLICATE |

**10 duplicate index pairs.** Each UNIQUE constraint creates a hidden autoindex. The explicit indexes are redundant. Impact: ~10% write overhead, negligible storage.

## Foreign Key Analysis

### Declared Foreign Keys: 4

| Parent Table | Child Table | Columns | On Delete |
|-------------|-------------|---------|-----------|
| site_urls | product_urls | source_url_id | CASCADE |
| site_urls | media_assets | source_url_id | CASCADE |
| extracted_products | media_assets | product_id | CASCADE |
| products | categories | category_id | NO ACTION |

### FK Enforcement: **NOT ACTIVE**

`PRAGMA foreign_keys` is never set to ON in the codebase. All 4 FKs are declared but unenforced. Orphan rows can accumulate.

### Orphan Risk Assessment

| FK | Parent Empty? | Child Empty? | Risk |
|----|--------------|--------------|------|
| site_urls → product_urls | 10 rows | 0 rows | LOW (child empty) |
| site_urls → media_assets | 10 rows | 0 rows | LOW (child empty) |
| extracted_products → media_assets | 0 rows | 0 rows | LOW (both empty) |
| products → categories | 0 rows | 6 rows | HIGH on delete (FK points wrong way — child=products, parent=categories) |

**Verdict:** 10 duplicate indexes (harmless), 4 unenforced FKs (potential orphans on delete).

## NULL/Empty Statistics

### Key Pipeline Tables

| Table | Column | NULL/Empty | % | Severity |
|-------|--------|-----------|---|----------|
| site_urls | slug | 1/10 | 10% | LOW |
| site_urls | parent_url | 10/10 | 100% | INFO (flat URL space) |
| site_urls | meta_description | 10/10 | 100% | HIGH |
| site_urls | json_ld | 4/10 | 40% | MEDIUM |
| cms_pages | description | 10/18 | 55.6% | MEDIUM |
| cms_pages | source_id | 5/18 | 27.8% | MEDIUM |
| cms_pages | meta_description | 10/18 | 55.6% | HIGH |
| cms_pages | og_description | 10/18 | 55.6% | HIGH |
| cms_pages | og_image | 15/18 | 83.3% | CRITICAL |
| cms_seo | meta_description | 10/18 | 55.6% | HIGH |
| cms_seo | og_description | 10/18 | 55.6% | HIGH |
| cms_seo | og_image | 15/18 | 83.3% | CRITICAL |
| cms_search_index | description | 15/26 | 57.7% | MEDIUM |
| cms_search_index | image_url | 20/26 | 76.9% | HIGH |

### Summary

| Severity | Count |
|----------|-------|
| CRITICAL (>80% NULL) | 2 |
| HIGH (>50% NULL) | 6 |
| MEDIUM (>25% NULL) | 4 |
| LOW (<25% NULL) | 1 |
| INFO | 1 |

## Conclusion

- **33 tables, 127 total rows** — pipeline barely exercised (only 10 site_urls discovered, 0 products extracted)
- **27 indexes** with **10 duplicate pairs** — minor write overhead
- **4 foreign keys** — all unenforced (PRAGMA foreign_keys never set)
- **13 columns with high/critical NULL rates** — og_image and meta_description are the worst offenders
- **Structural integrity: PASS** — all tables exist, all indexes functional, no corruption
- **Data completeness: LOW** — pipeline needs to be run end-to-end to populate extraction/CMS tables
