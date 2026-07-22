# ANALYZER DATA GOVERNANCE AUDIT REPORT

**Date:** 2026-07-15
**Status:** READ ONLY �� No code changes made
**Scope:** Data flow from extraction �� analysis �� SQLite �� downstream consumers

---

## Executive Summary

The analyzer layer (regex or Gemini) **OVERWRITES raw extraction facts** at the SQLite write level. For 9 of 22 extracted_products columns, the analyzer output takes precedence over DOM-extracted data. This is a **governance risk** �� the analyzer is an enrichment layer, but it currently acts as the authoritative source.

**Overall Risk Level: MEDIUM**

---

## Field Overwrite Matrix

| SQLite Column | Data Source | Overwrite Risk | Risk Level |
|---|---|---|---|
| title | geminiResult.title OR extraction.title | Analyzer wins if non-empty | LOW |
| subtitle | geminiResult.subtitle OR extraction.subtitle | Analyzer wins if non-empty | LOW |
| description | geminiResult.description OR extraction.description | Analyzer wins if non-empty | LOW |
| short_description | geminiResult.shortDescription OR extraction.shortDescription | Analyzer wins if non-empty | LOW |
| category | geminiResult.category OR "Unknown" | Analyzer wins if non-empty | LOW |
| subcategory | geminiResult.subcategory | Analyzer OVERWRITES (no fallback) | MEDIUM |
| brand | geminiResult.brand | Analyzer OVERWRITES (no fallback) | MEDIUM |
| model | geminiResult.model | Analyzer OVERWRITES (no fallback) | MEDIUM |
| sku | geminiResult.sku | Analyzer OVERWRITES (no fallback) | MEDIUM |
| specifications_json | JSON.stringify(geminiResult.specifications) | FULL REPLACEMENT | HIGH |
| faq_json | JSON.stringify(geminiResult.faq) | FULL REPLACEMENT | HIGH |
| related_products_json | JSON.stringify(geminiResult.relatedProducts) | FULL REPLACEMENT | HIGH |
| images_json | JSON.stringify(images) | DOM extraction only | NONE |
| gallery_json | JSON.stringify(images) | DOM extraction only | NONE |
| downloads_json | JSON.stringify(downloads) | DOM extraction only | NONE |
| seo_json | JSON.stringify(seo) | DOM extraction only | NONE |
| schema_json | JSON.stringify(schema) | DOM extraction only | NONE |
| language | Hardcoded 'en' | No analyzer involvement | NONE |
| recovery_status | Computed from engine name | No analyzer involvement | NONE |
| extraction_engine | From extraction result | No analyzer involvement | NONE |
| last_attempt | CURRENT_TIMESTAMP | No analyzer involvement | NONE |
| failure_reason | Empty string on success | No analyzer involvement | NONE |

---

## Detailed Analysis by Field Category

### SAFE: Image and Media Fields (No Analyzer Involvement)

**Fields:** images_json, gallery_json, downloads_json

**Code (detail-extraction-engine.ts:191-193):**
`	s
JSON.stringify(images),      // DOM extraction -> images_json
JSON.stringify(images),      // DOM extraction -> gallery_json (duplicated)
JSON.stringify(downloads),   // DOM extraction -> downloads_json
`

**Verdict:** These fields bypass the analyzer entirely. DOM-extracted data flows directly to SQLite. No overwrite risk.

---

### SAFE: SEO and Schema Fields (No Analyzer Involvement)

**Fields:** seo_json, schema_json

**Code (detail-extraction-engine.ts:195-196):**
`	s
JSON.stringify(seo),    // DOM extraction -> seo_json
JSON.stringify(schema), // DOM extraction -> schema_json
`

**Verdict:** These fields bypass the analyzer entirely. DOM-extracted data flows directly to SQLite. No overwrite risk.

---

### LOW RISK: Text Fields with Fallback (Analyzer Wins If Non-Empty)

**Fields:** title, subtitle, description, short_description, category

**Code (detail-extraction-engine.ts:182-186):**
`	s
geminiResult.title || title,           // Analyzer wins if non-empty
geminiResult.subtitle || subtitle,     // Analyzer wins if non-empty
geminiResult.description || description, // Analyzer wins if non-empty
geminiResult.shortDescription || shortDescription, // Analyzer wins if non-empty
geminiResult.category || "Unknown",    // Analyzer wins if non-empty
`

**How the Regex Analyzer Produces These Values:**
- title: From JSON-LD Product.name, or HTML title/h1/og:title
- subtitle: From JSON-LD Product.description (truncated to 200 chars), or HTML meta description/h2
- description: From JSON-LD Product.description, or empty string
- shortDescription: From JSON-LD Product.disambiguatingDescription, or first 300 chars of description
- category: From JSON-LD Product.category, or HTML meta product:category, or breadcrumb links

**Risk:** If the analyzer returns an empty string for any field, the DOM-extracted value is used as fallback. If the analyzer returns a non-empty but incorrect value, it overwrites the DOM extraction.

**Example:** If JSON-LD contains name="Product A" but the h1 says "Product A - Premium Edition", the analyzer picks the JSON-LD version (shorter), overwriting the more descriptive DOM version.

---

### MEDIUM RISK: Fields Without Fallback

**Fields:** subcategory, brand, model, sku

**Code (detail-extraction-engine.ts:187-190):**
`	s
geminiResult.subcategory,  // No fallback - always uses analyzer output
geminiResult.brand,        // No fallback - always uses analyzer output
geminiResult.model,        // No fallback - always uses analyzer output
geminiResult.sku,          // No fallback - always uses analyzer output
`

**How the Regex Analyzer Produces These Values:**
- subcategory: From HTML breadcrumb navigation links (3rd link)
- brand: From JSON-LD Product.brand, or HTML meta product:brand, or HTML element with class brand/manufacturer
- model: From JSON-LD Product.model, or HTML meta product:retailer_item_id
- sku: From JSON-LD Product.sku, or HTML meta product:retailer_item_id, or HTML element with class sku/product-sku

**Risk:** If the DOM extraction captures a brand/model/sku but the analyzer returns empty string (e.g., JSON-LD missing), the SQLite column receives empty string. **No fallback to DOM extraction.**

**Example:** If extractBrandFromHtml() finds "Acme Corp" in a DOM element but productData.brand is undefined in JSON-LD, the analyzer returns "", overwriting the DOM-extracted "Acme Corp" with empty string.

---

### HIGH RISK: Array Fields - Full Replacement

**Fields:** specifications_json, faq_json, related_products_json

**Code (detail-extraction-engine.ts:194,197-198):**
`	s
JSON.stringify(geminiResult.specifications),     // FULL REPLACEMENT
JSON.stringify(geminiResult.relatedProducts),    // FULL REPLACEMENT
JSON.stringify(geminiResult.faq),                // FULL REPLACEMENT
`

**How the Regex Analyzer Produces These Values:**
- specifications: Starts with DOM-extracted specs, then adds from JSON-LD additionalProperty, weight, depth, width, height
- faq: Starts with DOM-extracted FAQ, then adds from HTML aria-expanded sections (only if existing is empty)
- relatedProducts: Starts from JSON-LD alsoLike, then adds from HTML "Related Products" / "You may also like" / "Cross-sell" sections

**Risk:** The analyzer completely replaces the DOM-extracted arrays. If the analyzer fails to extract specifications correctly (e.g., JSON-LD is malformed), the DOM-extracted specifications are lost.

**Example:** If extractSpecifications(html) finds 10 specs from HTML tables but the analyzer normalizeSpecs() only produces 3 specs from JSON-LD, the final specifications_json contains only 3 specs. The 7 DOM-extracted specs are lost.

---

## Data Flow Diagram

`
PHASE 1: DOM EXTRACTION (dom-extractor.ts)
  html -> extractTitle(html)           -> title (DOM)
       -> extractSubtitle(html)        -> subtitle (DOM)
       -> extractDescription(html)     -> description (DOM)
       -> extractShortDescription(html)-> shortDesc (DOM)
       -> extractImages(html)          -> images (DOM)
       -> extractDownloads(html)       -> downloads (DOM)
       -> extractSpecifications(html)  -> specs (DOM)
       -> extractSEO(html)             -> seo (DOM)
       -> extractSchema(html)          -> schema (DOM)
       -> extractFAQ(html)             -> faq (DOM)
       -> extractPageStructure(html)   -> structure (DOM)
            |
            v
PHASE 2: ANALYZER (regex-analyzer.ts / gemini-analyzer.ts)
  buildAnalyzerInput({
    url, html, schema, networkData,
    specifications (DOM), faq (DOM), pageStructure (DOM)
  })
            |
            v
  analyzeWithGemini(input):
    - findProductInJsonLd(structuredData) -> productData
    - title = productData.name || extractTitleFromHtml(html)
    - subtitle = productData.description || extractSubtitleFromHtml(html)
    - brand = extractBrand(productData, html)
    - model = extractModel(productData, html)
    - sku = productData.sku || extractSkuFromHtml(html)
    - specifications = normalizeSpecs(existingSpecs, productData)
    - faq = normalizeFAQ(existingFAQ, html)
    - relatedProducts = extractRelatedProducts(html, structuredData)
            |
            v
  GeminiOutput { title, subtitle, ..., specifications, faq, relatedProducts }
            |
            v
PHASE 3: SQLite WRITE (detail-extraction-engine.ts:182-201)
  UPDATE extracted_products SET
    title = geminiResult.title || extraction.title,        -- Analyzer wins
    subtitle = geminiResult.subtitle || extraction.subtitle, -- Analyzer wins
    brand = geminiResult.brand,                             -- Analyzer OVERWRITES
    specifications_json = geminiResult.specifications,      -- FULL REPLACEMENT
    faq_json = geminiResult.faq,                            -- FULL REPLACEMENT
    images_json = images,                                   -- DOM only (safe)
    seo_json = seo,                                         -- DOM only (safe)
    schema_json = schema,                                   -- DOM only (safe)
    ...
            |
            v
PHASE 4: DOWNSTREAM CONSUMERS
  detail-output-generator.ts -> products.json
    - Reads all fields from extracted_products
    - No transformation or fallback logic
    - Whatever is in SQLite is what gets served
`

---

## Key Finding: Regex Analyzer Re-Extracts from Same HTML

The regex analyzer (nalyzeWithGemini) receives the HTML and re-extracts data that was already extracted by DOM extraction functions. This creates a **dual extraction pipeline** where the same data is extracted twice:

1. **DOM extraction** (dom-extractor.ts): extractTitle(html), extractBrand(html), etc.
2. **Analyzer re-extraction** (gemini-analyzer.ts): extractTitleFromHtml(html), extractBrand(productData, html), etc.

The analyzer has its own extraction functions (e.g., extractTitleFromHtml, extractBrand) that operate on the same HTML but use different logic. The analyzer version wins, which means DOM-extracted values are ignored even when they might be more accurate.

---

## Recommended Target Architecture

### Current (Problematic)
`
extracted_products table:
  title = analyzer.title || dom.title
  brand = analyzer.brand           (no fallback)
  specifications_json = analyzer.specifications  (full replacement)
`

### Recommended (Safe)
`
extracted_products table:
  title_raw = dom.title             (always preserved)
  title = analyzer.title || dom.title  (final value)
  brand_raw = dom.brand             (always preserved)
  brand = analyzer.brand || dom.brand  (final value)
  specifications_raw_json = dom.specs  (always preserved)
  specifications_json = analyzer.specs || dom.specs  (final value)
`

**Pattern:** For each field, add a _raw column that always stores the DOM-extracted value. The existing column stores the final value (analyzer preferred, DOM fallback). This preserves the original extraction for auditing and recovery.

---

## Migration Risk Assessment

| Change | Risk Level | Effort | Impact |
|---|---|---|---|
| Add _raw columns to extracted_products | LOW | Low | Preserves extraction audit trail |
| Update extraction engines to write _raw | LOW | Low | Backward compatible |
| Update output generator to prefer _raw for audits | LOW | Low | Non-breaking |
| Add fallback logic for brand/model/sku/subcategory | LOW | Low | Fixes data loss bug |
| Separate analyzer from DOM extraction | MEDIUM | Medium | Prevents dual extraction |
| Add analyzer confidence scores | MEDIUM | Medium | Enables quality filtering |

---

## Files Referenced

- src/discovery/detail-extraction-engine.ts:182-201 (SQLite write pattern)
- src/discovery/extraction-with-recovery.ts:190-211 (identical SQLite write pattern)
- src/discovery/gemini-analyzer.ts:53-99 (analyzer output construction)
- src/discovery/gemini-analyzer.ts:29-45 (GeminiOutput interface)
- src/discovery/adapters/gemini-analyzer.ts:78-114 (Gemini API adapter validation)
- src/discovery/adapters/regex-analyzer.ts:13-18 (regex adapter delegation)
- src/discovery/analyzer-input-builder.ts:28-37 (input construction)
- src/discovery/detail-output-generator.ts:45-77 (downstream consumption)
- src/lib/db.ts:208-241 (extracted_products schema)
- src/types/discovery.ts:434-466 (ExtractedProduct type)
- src/types/discovery.ts:544-581 (ProductSpecification, ProductFAQ, ProductRelatedProduct types)
