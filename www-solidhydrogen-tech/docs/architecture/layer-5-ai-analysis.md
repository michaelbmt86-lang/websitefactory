# Layer 5 — AI Analysis Layer

## Layer Name

**Layer 5 — AI Analysis Layer**

## Primary Purpose

Layer 5 AI Analysis Layer is the analysis and normalization subsystem of the Website Factory pipeline. It owns ALL AI-powered analysis: receiving raw extraction data from Layer 4, validating completeness, normalizing HTML/CSS/media, extracting semantic structure, identifying reusable components, generating structured JSON, producing CMS-ready content, generating SEO metadata, and producing analysis reports.

Layer 5 does NOT crawl websites, acquire webpages, manage browser sessions, store data, deploy, or render UI. It is the **analysis brain** that transforms raw extraction data into structured, normalized output for downstream consumption.

---

## Critical Constraint

**Gemini is Analysis Only.** It NEVER crawls, NEVER replaces Chrome DevTools MCP, NEVER replaces JCodesMore, NEVER replaces Firecrawl. Layer 5 receives pre-extracted data and analyzes it. Browser extraction belongs to Layer 4.

---

## Analysis Priority Chain

```
Layer 4 Output (DOM, HTML, CSS, JS, Images, Video, SVG, Fonts, Links, Metadata)
    ↓
Layer 5 Analysis
    ├─ Validate Completeness (R2)
    ├─ Normalize HTML (R3)
    ├─ Normalize CSS (R4)
    ├─ Normalize Media (R5)
    ├─ Extract Semantic Structure (R6)
    ├─ Identify Reusable Components (R7)
    ├─ Generate Structured JSON (R8)
    ├─ Generate CMS-Ready Content (R9)
    ├─ Generate SEO Metadata (R10)
    ├─ Generate Analysis Report (R11)
    └─ Return Normalized Output (R12)
```

---

## Responsibilities

### R1. Receive Raw Extraction Data

| Attribute | Detail |
|---|---|
| **Purpose** | Receive raw extraction output from Layer 4 (DOM, HTML, CSS, JS, media, metadata) |
| **Input** | ExtractionEngineResult from Layer 4 (HTML string, title, engine name, duration) |
| **Output** | GeminiInput struct with url, html, structuredData, networkData, existingSpecs, existingFAQ, existingStructure |
| **Dependencies** | Layer 4 browser extraction output |
| **Failure Behaviour** | Return input validation error to Layer 3 |

### R2. Validate Extraction Completeness

| Attribute | Detail |
|---|---|
| **Purpose** | Assess extraction completeness before analysis — check for missing fields, empty content, insufficient data |
| **Input** | Raw extraction data (HTML, structured data, network data) |
| **Output** | CompletenessReport with score, missing fields, issues |
| **Dependencies** | quality-validator.ts |
| **Failure Behaviour** | Flag incomplete extractions; continue with available data |

### R3. Normalize HTML

| Attribute | Detail |
|---|---|
| **Purpose** | Clean and normalize raw HTML — strip scripts, styles, comments; decode entities; normalize whitespace |
| **Input** | Raw HTML string from Layer 4 |
| **Output** | Cleaned HTML string |
| **Dependencies** | dynamic-renderer.ts (prepareHtmlForExtraction) |
| **Failure Behaviour** | Return original HTML if normalization fails |

### R4. Normalize CSS

| Attribute | Detail |
|---|---|
| **Purpose** | Extract and normalize CSS data — inline styles, external stylesheets, design tokens |
| **Input** | Raw HTML string |
| **Output** | Normalized CSS data (design tokens, color palette, typography, spacing) |
| **Dependencies** | HTML parsing |
| **Failure Behaviour** | Return empty CSS data; log warning |

### R5. Normalize Media

| Attribute | Detail |
|---|---|
| **Purpose** | Normalize media assets — deduplicate, validate URLs, categorize (image, video, download), extract metadata |
| **Input** | Raw media data from extraction |
| **Output** | NormalizedMedia with categorized assets, deduplication hash, metadata |
| **Dependencies** | media-extractor.ts |
| **Failure Behaviour** | Return partial media list; log missing categories |

### R6. Extract Semantic Structure

| Attribute | Detail |
|---|---|
| **Purpose** | Extract semantic structure from HTML — title, description, headings, sections, navigation, breadcrumbs, FAQ, specifications |
| **Input** | Normalized HTML, structured data (JSON-LD), network data |
| **Output** | ProductPageStructure with title, subtitle, description, headings, sections, CTAs, accordions, tabs |
| **Dependencies** | dom-extractor.ts (13 extraction functions) |
| **Failure Behaviour** | Return partial structure; log missing fields |

### R7. Identify Reusable Components

| Attribute | Detail |
|---|---|
| **Purpose** | Identify reusable UI components from page structure — hero sections, product grids, feature blocks, testimonials, footers |
| **Input** | Semantic structure, HTML patterns |
| **Output** | ComponentList with identified components, confidence scores, placement suggestions |
| **Dependencies** | Semantic structure from R6 |
| **Failure Behaviour** | Return empty component list; log identification failure |

### R8. Generate Structured JSON

| Attribute | Detail |
|---|---|
| **Purpose** | Generate structured JSON output from normalized data — products.json, media-library.json, seo-library.json, schema-library.json |
| **Input** | Normalized product data, media data, SEO data, schema data |
| **Output** | Structured JSON files written to docs/discovery/ |
| **Dependencies** | detail-output-generator.ts, SQLite (extracted_products, media_assets) |
| **Failure Behaviour** | Generate partial JSON; log missing data |

### R9. Generate CMS-Ready Content

| Attribute | Detail |
|---|---|
| **Purpose** | Generate CMS-ready content — pages, brands, collections, blog posts, search index |
| **Input** | Normalized product data, site URLs, categories |
| **Output** | CMS data written to SQLite (cms_pages, cms_brands, cms_collections, cms_posts, cms_search) |
| **Dependencies** | cms/ directory (8 generators) |
| **Failure Behaviour** | Generate partial CMS; log generation failures |

### R10. Generate SEO Metadata

| Attribute | Detail |
|---|---|
| **Purpose** | Generate SEO metadata for all CMS pages — meta titles, descriptions, OG tags, canonical, schema |
| **Input** | CMS pages, product data |
| **Output** | SEO metadata written to SQLite (cms_seo) |
| **Dependencies** | cms/seo-generator.ts |
| **Failure Behaviour** | Generate fallback SEO from page title/description |

### R11. Generate Analysis Report

| Attribute | Detail |
|---|---|
| **Purpose** | Produce structured analysis report — extraction quality, normalization results, component inventory, SEO coverage |
| **Input** | All analysis results from R2-R10 |
| **Output** | AnalysisReport with summary, quality scores, component inventory, SEO coverage |
| **Dependencies** | All R2-R10 outputs |
| **Failure Behaviour** | Generate partial report; log missing sections |

### R12. Return Normalized Output

| Attribute | Detail |
|---|---|
| **Purpose** | Return normalized, structured output to Layer 3 for storage and CMS generation |
| **Input** | All analysis results |
| **Output** | NormalizedOutput with products, components, SEO, schema, media, report |
| **Dependencies** | All R2-R11 outputs |
| **Failure Behaviour** | Return partial output; log missing sections |

### R13. Return Execution Status

| Attribute | Detail |
|---|---|
| **Purpose** | Return structured analysis status to Layer 3 for workflow progression |
| **Input** | Analysis session results |
| **Output** | AnalysisStatusResponse with coverage, quality metrics, analysis duration |
| **Dependencies** | All R2-R12 outputs |
| **Failure Behaviour** | Return partial status if some metrics unavailable |

---

## Inputs

| Input | Source | Description |
|---|---|---|
| Raw HTML | Layer 4 | Captured page content |
| Page Title | Layer 4 | Extracted page title |
| Structured Data | Layer 4 | JSON-LD, microdata, RDFa |
| Network Data | Layer 4 | API endpoints, embedded JSON, lazy-loaded content |
| Media Assets | Layer 4 | Images, videos, downloads |
| Extraction Metadata | Layer 4 | Engine name, duration, success/failure |

## Outputs

| Output | Destination | Description |
|---|---|---|
| Normalized Products | SQLite (extracted_products) | Cleaned, normalized product data |
| Media Assets | SQLite (media_assets) | Deduplicated, categorized media |
| SEO Metadata | SQLite (cms_seo) | Generated SEO for all pages |
| CMS Content | SQLite (cms_pages, cms_brands, etc.) | Generated CMS entities |
| Structured JSON | docs/discovery/ | products.json, media-library.json, seo-library.json, schema-library.json |
| Analysis Report | Layer 3 | Quality scores, component inventory, SEO coverage |
| Status Response | Layer 3 (API) | Analysis status for workflow progression |

---

## Data Flow

```
Layer 4 (Browser Extraction)
    │
    ├─ Raw HTML + Title + Engine
    │
    ▼
Layer 5 (AI Analysis)
    │
    ├─ R1: Receive Data → R2: Validate Completeness
    │   └─ Incomplete? → Log issues → Continue with available data
    │
    ├─ R3: Normalize HTML → R4: Normalize CSS → R5: Normalize Media
    │
    ├─ R6: Extract Semantic Structure
    │   ├─ Title, Description, Headings
    │   ├─ Specifications (JSON-LD + HTML)
    │   ├─ FAQ (Schema + HTML)
    │   ├─ Breadcrumbs (JSON-LD + HTML)
    │   └─ Page Structure (CTAs, Accordions, Tabs)
    │
    ├─ R7: Identify Reusable Components
    │   └─ Hero, Product Grid, Feature Block, Testimonial, Footer
    │
    ├─ R8: Generate Structured JSON
    │   └─ products.json, media-library.json, seo-library.json, schema-library.json
    │
    ├─ R9: Generate CMS-Ready Content
    │   └─ Pages, Brands, Collections, Blog Posts, Search Index
    │
    ├─ R10: Generate SEO Metadata
    │   └─ Meta titles, descriptions, OG tags, canonical, schema
    │
    ├─ R11: Generate Analysis Report
    │   └─ Quality scores, component inventory, SEO coverage
    │
    └─ R12: Return Normalized Output → R13: Return Status
        └─ To Layer 3 for storage and CMS generation
```

---

## Policy Usage

| Policy | Used By | Enforcement |
|---|---|---|
| Quality Policy (quality-policy.json) | R2 Validate Completeness | DOM completeness: 70%, asset completeness: 60%, SEO: 80% |
| Extraction Policy (extraction-policy.json) | R3-R6 Normalization | Strategy: dom-extraction-plus-heuristic |
| Architecture Lock | All R1-R13 | Gemini is Analysis Only; never crawls |

---

## Recovery Capability

| Scenario | Behaviour |
|---|---|
| Empty HTML received | R2 validation fails; return validation error to Layer 3 |
| Missing structured data | R6 falls back to regex extraction from HTML |
| Missing media assets | R5 returns partial media list; log warning |
| SEO data incomplete | R10 generates fallback SEO from page title/description |
| CMS generation fails | R9 generates partial CMS; log generation failures |
| Gemini analysis fails | R6 falls back to heuristic extraction; log failure |

---

## Implementation Files

| File | Purpose |
|---|---|
| `src/discovery/gemini-analyzer.ts` | Heuristic normalization (R6, R7, R8) — NOT real AI |
| `src/discovery/dom-extractor.ts` | DOM data extraction (R3, R6) — 13 extraction functions |
| `src/discovery/media-extractor.ts` | Media asset extraction (R5) |
| `src/discovery/network-analyzer.ts` | Network data analysis (R1) |
| `src/discovery/dynamic-renderer.ts` | HTML preprocessing (R3) |
| `src/discovery/quality-validator.ts` | Quality validation (R2) |
| `src/discovery/detail-output-generator.ts` | JSON output generation (R8) |
| `src/discovery/detail-extraction-engine.ts` | Extraction orchestration (R1-R13) |
| `src/discovery/extraction-with-recovery.ts` | Recovery extraction (R1-R13) |
| `src/discovery/cms/cms-generator-engine.ts` | CMS generation orchestrator (R9) |
| `src/discovery/cms/page-generator.ts` | CMS page generation (R9) |
| `src/discovery/cms/brand-generator.ts` | CMS brand generation (R9) |
| `src/discovery/cms/collection-generator.ts` | CMS collection generation (R9) |
| `src/discovery/cms/blog-generator.ts` | CMS blog generation (R9) |
| `src/discovery/cms/seo-generator.ts` | SEO metadata generation (R10) |
| `src/discovery/cms/search-index-generator.ts` | Search index generation (R9) |
| `src/discovery/cms/cms-quality-validator.ts` | CMS quality validation (R9) |
| `src/discovery/cms/cms-output-generator.ts` | CMS output files (R9) |
| `src/types/discovery.ts` | All type definitions |

---

## Layer Boundary Constraints

| Constraint | Rule |
|---|---|
| **Layer 5 does NOT crawl websites** | All crawling is Layer 4 responsibility |
| **Layer 5 does NOT acquire webpages** | Browser extraction is Layer 4 responsibility |
| **Layer 5 does NOT manage browser sessions** | Session management is Layer 4 responsibility |
| **Layer 5 does NOT store data** | Data storage is Layer 3 → SQLite |
| **Layer 5 does NOT deploy** | Deployment is Layer 2 responsibility |
| **Layer 5 does NOT render UI** | UI rendering is Next.js responsibility |
| **Layer 5 does NOT manage Dashboard** | Dashboard is Layer 2 responsibility |
| **Layer 5 does NOT verify** | Verification is separate pipeline |
| **Layer 5 DOES analyze data** | AI-powered analysis and normalization |
| **Layer 5 DOES normalize HTML** | HTML cleaning and normalization |
| **Layer 5 DOES normalize CSS** | CSS extraction and normalization |
| **Layer 5 DOES normalize Media** | Media deduplication and categorization |
| **Layer 5 DOES extract structure** | Semantic structure extraction |
| **Layer 5 DOES identify components** | Reusable component identification |
| **Layer 5 DOES generate JSON** | Structured JSON output |
| **Layer 5 DOES generate CMS** | CMS-ready content generation |
| **Layer 5 DOES generate SEO** | SEO metadata generation |
| **Layer 5 DOES produce reports** | Analysis reports |
