# Layer 5 — AI Analysis Layer Gap Analysis

## Audit Date

2026-07-18

## Audit Scope

All 13 responsibilities (R1–R13) of the AI Analysis Layer. Codebase audit of `src/discovery/`, `src/discovery/cms/`, and related files.

---

## Responsibility Status Matrix

| Responsibility | Status | File(s) | Notes |
|---|---|---|---|
| R1. Receive Raw Extraction Data | ⚠️ PARTIAL | `detail-extraction-engine.ts` | Pipeline mixes Layer 4 fetch + Layer 5 analysis. No clean handoff. |
| R2. Validate Extraction Completeness | ⚠️ PARTIAL | `quality-validator.ts` | Post-extraction validation only. No pre-analysis completeness check. |
| R3. Normalize HTML | ⚠️ PARTIAL | `dynamic-renderer.ts` | `prepareHtmlForExtraction` strips scripts/styles. No entity decoding, whitespace normalization. |
| R4. Normalize CSS | ❌ MISSING | — | No CSS normalization exists. `network-analyzer.ts` extracts CSS URLs but does not normalize. |
| R5. Normalize Media | ⚠️ PARTIAL | `media-extractor.ts` | Extracts images/videos/downloads. No deduplication, no categorization, no metadata normalization. |
| R6. Extract Semantic Structure | ✅ COMPLETE | `dom-extractor.ts` | 13 extraction functions covering title, description, specs, FAQ, breadcrumbs, page structure, schema, SEO. |
| R7. Identify Reusable Components | ❌ MISSING | — | No component identification logic anywhere in codebase. Dead code in `src/analyzer/` was removed. |
| R8. Generate Structured JSON | ✅ COMPLETE | `detail-output-generator.ts` | Generates products.json, media-library.json, seo-library.json, schema-library.json. |
| R9. Generate CMS-Ready Content | ✅ COMPLETE | `cms/cms-generator-engine.ts` + 8 sub-generators | Full CMS pipeline: pages, brands, collections, blog, search index, quality, output. |
| R10. Generate SEO Metadata | ✅ COMPLETE | `cms/seo-generator.ts` | Auto-generates SEO for all CMS pages with fallback from page title/description. |
| R11. Generate Analysis Report | ⚠️ PARTIAL | `quality-validator.ts` | QualityReport covers extraction quality only. No component inventory, no SEO coverage report, no normalization report. |
| R12. Return Normalized Output | ⚠️ PARTIAL | `detail-extraction-engine.ts` | ExtractionPipelineResult returned. Fields don't fully match NormalizedOutput spec. |
| R13. Return Execution Status | ⚠️ PARTIAL | `extraction-with-recovery.ts` | DetailExtractionResult returned. No analysis-specific status (coverage, quality metrics). |

---

## Detailed Findings

### R1. Receive Raw Extraction Data — ⚠️ PARTIAL

**What exists:**
- `detail-extraction-engine.ts` (328 lines) orchestrates the full pipeline
- Calls `fetchText(url)` to get HTML, then `prepareHtmlForExtraction(rawHtml)` to clean it
- Passes cleaned HTML to DOM extraction functions and Gemini analyzer

**What's missing:**
- No clean Layer 4 → Layer 5 handoff. The engine fetches HTML itself (Layer 4 responsibility) AND runs analysis (Layer 5 responsibility)
- No `GeminiInput` struct is constructed from Layer 4 output — it's built inline
- `extraction-with-recovery.ts` wraps the engine but doesn't separate concerns

**Boundary violation:** `detail-extraction-engine.ts:109` calls `fetchText(url)` — this is Layer 4 (browser acquisition) work being done inside what should be a Layer 5 analysis engine.

---

### R2. Validate Extraction Completeness — ⚠️ PARTIAL

**What exists:**
- `quality-validator.ts` (171 lines) — checks products after extraction for missing images, SEO, schema, specs, broken downloads, duplicates
- Returns `QualityCheckResult` with issues array and summary counts

**What's missing:**
- No pre-analysis completeness check. Validation runs AFTER extraction, not before analysis
- No validation of input data quality before running Gemini analysis
- No completeness score (only pass/fail per issue type)

---

### R3. Normalize HTML — ⚠️ PARTIAL

**What exists:**
- `dynamic-renderer.ts:prepareHtmlForExtraction()` strips `<script>`, `<style>`, comments, and lazy-load wrappers

**What's missing:**
- No HTML entity decoding (`&amp;` → `&`, `&nbsp;` → space)
- No whitespace normalization (multiple spaces → single space, trim)
- No tag normalization (lowercase attributes, normalize quotes)
- No duplicate attribute removal

---

### R4. Normalize CSS — ❌ MISSING

**What exists:**
- `network-analyzer.ts` extracts CSS URLs from HTML via regex patterns
- No CSS parsing, no design token extraction, no color palette extraction

**What's missing:**
- No CSS normalization at all
- No inline style extraction and normalization
- No external stylesheet parsing
- No design token extraction (colors, typography, spacing)
- No color palette generation

---

### R5. Normalize Media — ⚠️ PARTIAL

**What exists:**
- `media-extractor.ts` (91 lines) — extracts images, videos, downloads from HTML
- Stores in SQLite `media_assets` table with product_id, type, url, filename, position

**What's missing:**
- No deduplication (same image URL can appear multiple times)
- No categorization beyond type (image/video/download)
- No metadata normalization (alt text, dimensions, file size)
- No URL normalization (relative → absolute, protocol normalization)

---

### R6. Extract Semantic Structure — ✅ COMPLETE

**What exists:**
- `dom-extractor.ts` (527 lines) — 13 extraction functions
- `extractTitle`, `extractSubtitle`, `extractDescription`, `extractShortDescription`
- `extractImages`, `extractDownloads`, `extractSpecifications`
- `extractSEO`, `extractSchema`, `extractFAQ`, `extractBreadcrumbs`
- `extractPageStructure` (headings, sections, CTAs, accordions, tabs)

**Assessment:** Fully covers R6 requirements. No gaps identified.

---

### R7. Identify Reusable Components — ❌ MISSING

**What exists:**
- Nothing. Dead code in `src/analyzer/` was removed in previous cleanup.
- `gemini-analyzer.ts` has `extractTags` and `extractCollection` which are regex-based tag extraction, NOT component identification

**What's missing:**
- No hero section identification
- No product grid detection
- No feature block recognition
- No testimonial extraction
- No footer/nav identification
- No component confidence scoring
- No placement suggestion generation

---

### R8. Generate Structured JSON — ✅ COMPLETE

**What exists:**
- `detail-output-generator.ts` (219 lines) — 4 generator functions
- `generateProductsJson()` — products.json with all product fields
- `generateMediaLibraryJson()` — media-library.json with images, videos, downloads
- `generateSeoLibraryJson()` — seo-library.json with meta titles, descriptions, OG tags
- `generateSchemaLibraryJson()` — schema-library.json with JSON-LD schemas

**Assessment:** Fully covers R8 requirements. Output written to `docs/discovery/`.

---

### R9. Generate CMS-Ready Content — ✅ COMPLETE

**What exists:**
- `cms/cms-generator-engine.ts` (107 lines) — orchestrates 8 generators
- `page-generator.ts` — CMS pages from site_urls + extracted_products
- `brand-generator.ts` — CMS brands from product brands
- `collection-generator.ts` — CMS collections from categories
- `blog-generator.ts` — CMS blog posts from posts table
- `search-index-generator.ts` — search index for all entities
- `cms-quality-validator.ts` — CMS quality validation
- `cms-output-generator.ts` — CMS manifest, navigation, sitemap

**Assessment:** Fully covers R9 requirements. Writes to SQLite tables.

---

### R10. Generate SEO Metadata — ✅ COMPLETE

**What exists:**
- `cms/seo-generator.ts` (57 lines) — auto-generates SEO for all CMS pages
- Uses page title/description as fallback when original SEO data missing
- Calculates SEO coverage percentage

**Assessment:** Fully covers R10 requirements. Writes to `cms_seo` table.

---

### R11. Generate Analysis Report — ⚠️ PARTIAL

**What exists:**
- `quality-validator.ts` returns `QualityCheckResult` with issues and summary
- Summary includes missingImages, missingSEO, missingSchema, missingSpecs, brokenDownloads, brokenMedia, duplicates

**What's missing:**
- No component inventory report
- No SEO coverage report (only extraction quality)
- No normalization report (HTML/CSS/media normalization results)
- No analysis duration/timing metrics
- No overall quality score (only per-issue severity)

---

### R12. Return Normalized Output — ⚠️ PARTIAL

**What exists:**
- `detail-extraction-engine.ts:generateResult()` returns `ExtractionPipelineResult`
- Includes totalProducts, extractedCount, failedCount, retriedCount, durationMs, products array

**What's missing:**
- No media library in output
- No SEO library in output
- No schema library in output
- No component inventory in output
- No analysis report in output
- Output is product-centric, not analysis-centric

---

### R13. Return Execution Status — ⚠️ PARTIAL

**What exists:**
- `extraction-with-recovery.ts` returns `DetailExtractionResult`
- Includes success, totalProducts, extractedCount, failedCount, durationMs

**What's missing:**
- No analysis coverage percentage
- No quality metrics (completeness score, normalization score)
- No component identification results
- No SEO coverage in status
- No per-product analysis status

---

## Summary

| Category | Count | Responsibilities |
|---|---|---|
| ✅ Complete | 4 | R6, R8, R9, R10 |
| ⚠️ Partial | 7 | R1, R2, R3, R5, R11, R12, R13 |
| ❌ Missing | 2 | R4, R7 |

**Overall Coverage:** 4/13 Complete (31%), 7/13 Partial (54%), 2/13 Missing (15%)

---

## Priority Recommendations

| Priority | Gap | Recommendation |
|---|---|---|
| HIGH | R7 (Component ID) | Implement component identification from semantic structure — hero, product grid, feature blocks, testimonials |
| HIGH | R1 (Boundary) | Separate `detail-extraction-engine.ts` into Layer 4 fetch + Layer 5 analysis. Create clean `GeminiInput` handoff |
| MEDIUM | R4 (CSS Norm) | Add CSS normalization — design token extraction, color palette, typography |
| MEDIUM | R11 (Report) | Expand QualityReport to include component inventory, SEO coverage, normalization metrics |
| LOW | R3 (HTML Norm) | Add HTML entity decoding and whitespace normalization to `prepareHtmlForExtraction` |
| LOW | R5 (Media Norm) | Add media deduplication and URL normalization to `media-extractor.ts` |
| LOW | R12/R13 (Output) | Expand output/status to include media library, SEO library, analysis report |
