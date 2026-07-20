# Final Impact Verification Report

**Date:** 2026-07-19
**Scope:** Replacing raw `fetchText()` HTML fetches with Extraction Manager (`extractWithRecovery()`)
**Status:** READ-ONLY — No code modified

---

## 1. HTML Fetch Entry Points

### EP-1: `extractPageData()` via Discovery Engine

| Field | Value |
|---|---|
| **File** | `src/discovery/page-extractor.ts:261` |
| **Function** | `extractPageData(url: string)` |
| **Caller** | `src/discovery/discovery-engine.ts:124` — `DiscoveryEngine.crawlPage()` |
| **API Endpoint** | `POST /api/discovery` |
| **Expected Input** | `string` — normalized URL |
| **Expected Output** | `PageMetadata` (title, metaDescription, canonical, h1, jsonLd, internalLinks, externalLinks, images, headerNavLinks, footerNavLinks, breadcrumbs) |
| **Returned HTML Type** | `string \| null` via `fetchText()` |
| **Current Implementation** | `const html = await fetchText(url);` — raw `fetch()` with 15s timeout |
| **Proposed Implementation** | `const result = await extractWithRecovery(url);` → unwrap `result.html` |
| **Estimated Impact** | HIGH — shared function, affects Discovery BFS (up to 500 pages) |

### EP-2: `extractPageData()` via Product Discovery

| Field | Value |
|---|---|
| **File** | `src/discovery/page-extractor.ts:261` |
| **Function** | `extractPageData(url: string)` |
| **Caller** | `src/discovery/product-discovery-engine.ts:323` — `ProductDiscoveryEngine.enrichProducts()` |
| **API Endpoint** | `POST /api/product-discovery` |
| **Expected Input** | `string` — product URL |
| **Expected Output** | `PageMetadata` |
| **Returned HTML Type** | `string \| null` via `fetchText()` |
| **Current Implementation** | `const html = await fetchText(url);` |
| **Proposed Implementation** | `const result = await extractWithRecovery(url);` → unwrap `result.html` |
| **Estimated Impact** | HIGH — same function as EP-1, affects Product Discovery enrichment |

### EP-3: `extractProduct()` via Detail Extraction

| Field | Value |
|---|---|
| **File** | `src/discovery/detail-extraction-engine.ts:109` |
| **Function** | `DetailExtractionEngine.extractProduct(url, slug)` |
| **Caller** | `src/discovery/detail-extraction-engine.ts:75` — `extract()` batch loop |
| **API Endpoint** | `POST /api/detail-extraction` (when `useRecovery=false`) |
| **Expected Input** | `string` — product URL |
| **Expected Output** | `void` — writes to `extracted_products` table |
| **Returned HTML Type** | `string \| null` via `fetchText()` |
| **Current Implementation** | `const rawHtml = await fetchText(url);` |
| **Proposed Implementation** | `const result = await extractWithRecovery(url);` → `result.html` |
| **Estimated Impact** | MEDIUM — bounded product set, already has retry logic |

### EP-4: `crawlListingPage()` listing page fetch

| Field | Value |
|---|---|
| **File** | `src/discovery/product-discovery-engine.ts:135` |
| **Function** | `ProductDiscoveryEngine.crawlListingPage(url, pageType)` |
| **Caller** | `src/discovery/product-discovery-engine.ts:86` — `discover()` Phase 2 |
| **API Endpoint** | `POST /api/product-discovery` |
| **Expected Input** | `string` — normalized listing page URL |
| **Expected Output** | `void` — stores product URLs in `product_urls` table |
| **Returned HTML Type** | `string \| null` via `fetchText()` |
| **Current Implementation** | `const html = await fetchText(normalized);` |
| **Proposed Implementation** | `const result = await extractWithRecovery(normalized);` → `result.html` |
| **Estimated Impact** | HIGH — unbounded listing pages, unbounded pagination follow |

### EP-5: `crawlListingPage()` pagination fetch

| Field | Value |
|---|---|
| **File** | `src/discovery/product-discovery-engine.ts:163` |
| **Function** | `ProductDiscoveryEngine.crawlListingPage(url, pageType)` — pagination loop |
| **Caller** | Same as EP-4 |
| **API Endpoint** | `POST /api/product-discovery` |
| **Expected Input** | `string` — pagination URL |
| **Expected Output** | `void` — stores product URLs in `product_urls` table |
| **Returned HTML Type** | `string \| null` via `fetchText()` |
| **Current Implementation** | `const paginationHtml = await fetchText(paginationUrl);` |
| **Proposed Implementation** | `const result = await extractWithRecovery(paginationUrl);` → `result.html` |
| **Estimated Impact** | HIGH — unbounded pagination depth |

---

## 2. Current Runtime Call Graph

### POST /api/discovery

```
POST /api/discovery
  route.ts:70 → discoverSite(url, opts)
    discovery-engine.ts:60 → DiscoveryEngine.discover()
      ├─ Line 100: fetchText(robots.txt)              ← XML, excluded
      ├─ Line 65:  discoverSitemaps() → fetchText()   ← XML, excluded
      ├─ Line 68:  crawlSitemaps() → fetchText()      ← XML, excluded
      └─ Line 86:  crawlPage(homepage)
           ├─ Line 124: extractPageData(normalized)
           │     └─ page-extractor.ts:261: fetchText(url)     ← fetch() 15s
           └─ Line 125: fetchPageStatus(normalized)           ← HEAD, excluded
      └─ Line 89: bfsCrawl()
           └─ Line 200: crawlPage() ×N (batches of 5)
                └─ [entire crawlPage chain repeats]
```

### POST /api/product-discovery

```
POST /api/product-discovery
  route.ts → discoverProducts(url)
    product-discovery-engine.ts:74 → ProductDiscoveryEngine.discover()
      ├─ Line 86: crawlListingPage() ×N
      │     ├─ Line 135: fetchText(normalized)               ← fetch() 15s
      │     └─ Line 163: fetchText(paginationUrl) ×N         ← fetch() 15s
      └─ Line 90: enrichProducts()
            └─ Line 323: extractPageData(product.url)
                  └─ page-extractor.ts:261: fetchText(url)   ← fetch() 15s
```

### POST /api/detail-extraction (useRecovery=false)

```
POST /api/detail-extraction
  route.ts:118 → extractProductDetails(url)
    detail-extraction-engine.ts:61 → DetailExtractionEngine.extract()
      └─ Line 109: fetchText(url)                           ← fetch() 15s
```

### POST /api/detail-extraction (useRecovery=true)

```
POST /api/detail-extraction
  route.ts:117 → extractProductDetailsWithRecovery(url)
    extraction-with-recovery.ts:62 → RecoveryExtractionEngine.extract()
      └─ Line 107: extractWithRecovery(url)                 ← ALREADY uses engine chain
```

---

## 3. Proposed Runtime Call Graph

### POST /api/discovery (after change)

```
POST /api/discovery
  route.ts:70 → discoverSite(url, opts)
    discovery-engine.ts:60 → DiscoveryEngine.discover()
      ├─ fetchText(robots.txt)              ← still fetchText (XML)
      ├─ discoverSitemaps() → fetchText()   ← still fetchText (XML)
      ├─ crawlSitemaps() → fetchText()      ← still fetchText (XML)
      └─ crawlPage(homepage)
           ├─ extractPageData(normalized)
           │     └─ page-extractor.ts:261: extractWithRecovery(url)  ← CHANGED
           │           └─ extraction-manager.ts:82
           │                 ├─ try chrome-devtools-mcp ×2
           │                 │     └─ fetchWithChromeDevTools()
           │                 │           └─ fetchText(url)           ← still fetch() under hood
           │                 ├─ try jcodesmore-browser ×2
           │                 │     └─ fetchWithJCodesMore()
           │                 │           └─ fetch(url) with Chrome UA
           │                 │           └─ expandHiddenContent(html) ← HTML MUTATION
           │                 │           └─ extractLazyContent(html)  ← HTML MUTATION
           │                 └─ try firecrawl ×2
           │                       └─ fetchWithFirecrawl()
           │                             └─ Firecrawl API or fetch() fallback
           │                                   └─ append JSON-LD content ← HTML MUTATION
           │                                   └─ append noscript content ← HTML MUTATION
           │           └─ recordMetric() → INSERT INTO extraction_metrics  ← NEW DB WRITE
           └─ fetchPageStatus(normalized)           ← HEAD, unchanged
      └─ bfsCrawl()
           └─ crawlPage() ×N (batches of 5)
                └─ [entire chain repeats per URL]
```

---

## 4. Impact Matrix

| Location | Current | Proposed | Risk |
|---|---|---|---|
| **EP-1** `page-extractor.ts` via Discovery | `fetchText()`: 15s timeout, 0 retries, returns `string \| null`, no DB writes, User-Agent `WebsiteFactory-Discovery/1.0`, no HTML mutation | `extractWithRecovery()`: 30s timeout × 2 retries × 3 engines = up to 180s worst case, returns `ExtractionEngineResult` (different type), writes to `extraction_metrics` per attempt, User-Agent changes per engine, JCodesMore/Firecrawl mutate HTML content | **HIGH** |
| **EP-2** `page-extractor.ts` via Product Discovery | Same as EP-1 | Same as EP-1 | **HIGH** |
| **EP-3** `detail-extraction-engine.ts` | `fetchText()`: 15s timeout, returns `string \| null`, no DB writes, raw HTML | `extractWithRecovery()`: 30s × 6 attempts worst case, DB writes per URL, HTML may be mutated by JCodesMore/Firecrawl before `prepareHtmlForExtraction()` is applied | **MEDIUM** |
| **EP-4** `product-discovery-engine.ts` listing pages | `fetchText()`: 15s timeout, returns `string \| null`, no DB writes | `extractWithRecovery()`: 30s × 6 attempts worst case, DB writes per listing page, HTML mutated | **HIGH** |
| **EP-5** `product-discovery-engine.ts` pagination | `fetchText()`: 15s timeout, returns `string \| null`, no DB writes | `extractWithRecovery()`: 30s × 6 attempts worst case, DB writes per pagination page | **HIGH** |
| **EP-6** `extraction-with-recovery.ts` | Already uses `extractWithRecovery()` | No change | **NONE** |

---

## 5. Interface Compatibility

### Return Type Mismatch

| | `fetchText()` | `extractWithRecovery()` |
|---|---|---|
| **Signature** | `(url: string) => Promise<string \| null>` | `(url: string, options?) => Promise<ExtractionEngineResult>` |
| **Return type** | `string \| null` | `{ success: boolean; engine: ExtractionEngineName; html: string \| null; title: string \| null; durationMs: number; error?: string }` |
| **Success value** | Raw HTML string | `{ success: true, html: "...", ... }` |
| **Failure value** | `null` | `{ success: false, html: null, error: "..." }` |

**Every caller must be adapted:**
- `extractPageData()` (EP-1, EP-2): line 261 assigns `const html = await fetchText(url)` → must become `const result = await extractWithRecovery(url); const html = result.success ? result.html : null;`
- `detail-extraction-engine.ts` (EP-3): line 109 assigns `const rawHtml = await fetchText(url)` → same adaptation
- `product-discovery-engine.ts` (EP-4, EP-5): lines 135, 163 assign `const html = await fetchText(...)` → same adaptation

### Timeout Comparison

| Engine | Timeout | Retries | Worst Case Per URL |
|---|---|---|---|
| `fetchText()` | 15s | 0 | 15s |
| chrome-devtools-mcp | 30s | 2 | 60s |
| jcodesmore-browser | 30s | 2 | 60s |
| firecrawl | 30s | 2 | 60s |
| **Total** | — | — | **180s** (12× current) |

### User-Agent Comparison

| Engine | User-Agent |
|---|---|
| `fetchText()` | `WebsiteFactory-Discovery/1.0` |
| chrome-devtools-mcp (via fetchText) | `WebsiteFactory-Discovery/1.0` |
| jcodesmore-browser | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36` |
| firecrawl fallback | `Mozilla/5.0 (compatible; Googlebot/2.1; ...)`, then Chrome, then Safari (tries 3) |

### HTML Content Mutation

| Engine | Mutates HTML? | What Changes |
|---|---|---|
| `fetchText()` | No | Returns raw HTML as-is |
| chrome-devtools-mcp | No | Wraps `fetchText()`, returns same HTML |
| jcodesmore-browser | **Yes** | `expandHiddenContent()`: replaces `display:none` → `display:block`, removes `aria-hidden`. `extractLazyContent()`: converts `data-src` → `src`, `loading="lazy"` → `loading="eager"` |
| firecrawl fallback | **Yes** | Appends JSON-LD content to HTML, appends noscript content to HTML |

**Critical:** When JCodesMore or Firecrawl is the recovery engine, the HTML returned is **not identical** to raw `fetchText()`. Downstream consumers that parse HTML (e.g., `parseHtml()` in page-extractor.ts) will receive different content.

### Double Transform Problem

`prepareHtmlForExtraction()` in `dynamic-renderer.ts` performs the **same transforms** as JCodesMore's `expandHiddenContent()` and `extractLazyContent()`:

| Transform | `prepareHtmlForExtraction()` (dynamic-renderer.ts) | JCodesMore (`expandHiddenContent` + `extractLazyContent`) |
|---|---|---|
| `display:none` → `display:block` | Yes (line 14-17) | Yes (jcodesmore-engine.ts:105-108) |
| Tab panel expansion | Yes (line 20-23) | Yes (jcodesmore-engine.ts:110-113) |
| `aria-hidden` removal | Yes (line 26-29) | Yes (jcodesmore-engine.ts:115-118) |
| `data-src` → `src` | No | Yes (jcodesmore-engine.ts:125) |
| `loading="lazy"` → `"eager"` | No | Yes (jcodesmore-engine.ts:129) |

If JCodesMore is the recovery engine AND `prepareHtmlForExtraction()` is also applied downstream (as in EP-3), transforms are **duplicated** for `display:none`/tab/aria-hidden patterns.

---

## 6. Downstream Compatibility

### SQLite

| Table | Read By | Affected? | How |
|---|---|---|---|
| `site_urls` | Discovery writes, CMS reads, Dashboard reads | **YES — Indirect** | Different HTML content → different `title`, `h1`, `meta_description`, `json_ld`, `internal_links`, `external_links`, `images` values written. CMS pages generated from `site_urls` may differ. |
| `product_urls` | Product Discovery writes, CMS reads, Dashboard reads | **YES — Indirect** | Different HTML → different `product_name`, `category`, `price`, `sku`, `image_url` values written via `extractPageData()` in enrichment. |
| `extracted_products` | Detail Extraction writes, CMS reads, Dashboard reads | **YES — Indirect** | Different HTML → different `title`, `description`, `specifications_json`, `seo_json`, `schema_json`, `faq_json` values. |
| `extraction_metrics` | Extraction Manager writes, Dashboard reads | **YES — Direct** | Currently 0 rows from Discovery/Product Discovery. After change: up to 500+ rows per Discovery run, 5000+ rows per Product Discovery run. |

### CMS Generator

| Module | Reads From | Affected? | How |
|---|---|---|---|
| `page-generator.ts` | `site_urls` (line 51), `extracted_products` (line 80) | **YES** | Pages generated from different data. If HTML content differs (JCodesMore/Firecrawl mutations), page titles, descriptions, and slugs may change. |
| `brand-generator.ts` | `extracted_products` (line 28) | **YES** | Brand extraction depends on product `brand` field which depends on HTML content. |
| `collection-generator.ts` | `extracted_products` (line 28) | **YES** | Collection generation depends on `category` field. |
| `search-index-generator.ts` | `extracted_products` (line 38) | **YES** | Search index depends on all product fields. |
| `blog-generator.ts` | `site_urls` (filtered by blog type) | **YES** | Blog content depends on page data from `site_urls`. |

### Dashboard

| Module | Reads From | Affected? | How |
|---|---|---|---|
| GET `/api/discovery` | `site_urls` | **YES** | Dashboard stats (urlsByType, urlsByStatus, depthStats) may change if different pages are classified differently due to HTML content changes. |
| GET `/api/product-discovery` | `product_urls` | **YES** | Product discovery stats may change. |
| GET `/api/detail-extraction` | `extracted_products`, `extraction_metrics` | **YES** | Recovery metrics (`primarySuccessCount`, `recoveryL1Count`, `recoveryL2Count`) will now include Discovery/Product Discovery data. |

### SEO

| Module | Affected? | How |
|---|---|---|
| SEO extraction from `extracted_products.seo_json` | **YES** | Different HTML → different `seo_json` values (title, metaDescription, canonical, ogTags). |
| `generateSEOLibraryJson()` | **YES** | Reads `extracted_products` → different input. |

### Schema

| Module | Affected? | How |
|---|---|---|
| Schema extraction from `extracted_products.schema_json` | **YES** | Firecrawl fallback **appends** JSON-LD content to HTML, potentially doubling schema data. |
| `generateSchemaLibraryJson()` | **YES** | Reads `extracted_products` → different input. |

### Media

| Module | Affected? | How |
|---|---|---|
| `extractAllMedia()` in detail extraction | **YES** | JCodesMore converts `data-src` → `src` and `loading="lazy"` → `loading="eager"`, changing which images are discovered. |
| `media_assets` table | **YES** | Different media assets stored. |

### Product Extraction

| Module | Affected? | How |
|---|---|---|
| `extractTitle()`, `extractDescription()`, etc. | **YES** | Different HTML input → different extracted values. |
| `extractSpecifications()` | **YES** | Hidden content expanded by JCodesMore may reveal additional specifications. |

### Category / Collection Extraction

| Module | Affected? | How |
|---|---|---|
| `classifyProduct()` | **YES** | Depends on `productName` from JSON-LD/title, which may differ. |
| Category assignment in `product_urls` | **YES** | Different `category` values → different CMS collections. |

---

## 7. Browser Engine Verification

### Chrome DevTools MCP

| Contract | Status | Evidence |
|---|---|---|
| Accepts URL input | ✅ | `fetchWithChromeDevTools(url, timeoutMs)` — `extraction-manager.ts:40` |
| Returns `ExtractionEngineResult` | ✅ | Returns `{ success, engine, html, title, durationMs }` — line 52 |
| HTML contract identical to `fetchText()` | ⚠️ **PARTIAL** | Wraps `fetchText(url)` at line 45, so HTML is identical. BUT: extracts title separately (line 50-51) and includes it in result — `fetchText()` does not. |
| No HTML mutation | ✅ | Returns raw HTML from `fetchText()` unmodified |
| Production-ready | ✅ | Fully implemented, tested, registered in engine chain |

### JCodesMore Browser

| Contract | Status | Evidence |
|---|---|---|
| Accepts URL input | ✅ | `fetchWithJCodesMore(url, timeoutMs)` — `jcodesmore-engine.ts:11` |
| Returns `ExtractionEngineResult` | ✅ | Returns `{ success, engine, html, title, durationMs }` — line 79 |
| HTML contract identical to `fetchText()` | ❌ **NO** | **Mutates HTML**: `expandHiddenContent()` at line 58, `extractLazyContent()` at line 60 |
| No HTML mutation | ❌ | `display:none` → `display:block`, `data-src` → `src`, `loading="lazy"` → `loading="eager"` |
| Production-ready | ✅ | Fully implemented, tested, registered in engine chain |

### Firecrawl

| Contract | Status | Evidence |
|---|---|---|
| Accepts URL input | ✅ | `fetchWithFirecrawl(url, timeoutMs)` — `firecrawl-engine.ts:11` |
| Returns `ExtractionEngineResult` | ✅ | Returns `{ success, engine, html, title, durationMs }` |
| HTML contract identical to `fetchText()` | ❌ **NO** | **Mutates HTML**: Appends JSON-LD content (line 160-162), appends noscript content (line 165-168) |
| No HTML mutation | ❌ | HTML content is **augmented** with additional data not in raw response |
| Production-ready | ✅ | Fully implemented, tested, registered in engine chain |

### Engine Chain

| Requirement | Status | Evidence |
|---|---|---|
| chrome-devtools-mcp → jcodesmore-browser → firecrawl priority | ✅ | `extraction-manager.ts:63-67` — `getEngineConfigs()` |
| Retry per engine | ✅ | `extraction-manager.ts:83` — `attempt <= engine.maxRetries` |
| Fallback on failure | ✅ | `extraction-manager.ts:82-98` — iterates engines sequentially |
| Firecrawl never primary | ✅ | `extraction-manager.ts:66` — always last in array |
| DB metrics recording | ✅ | `extraction-manager.ts:89,100,104` — `recordMetric()` on every outcome |
| Return type consistency | ✅ | All 3 engines return `ExtractionEngineResult` |

---

## 8. Performance Projection

### Discovery BFS (maxPages=500, concurrency=5)

| Metric | Current | After Change |
|---|---|---|
| Timeout per page | 15s | 180s worst case |
| Best case per page | ~1s | ~1s (chrome-devtools-mcp succeeds) |
| Worst case per page | 15s | 180s |
| DB writes per page | 0 | Up to 6 rows in `extraction_metrics` |
| Total DB writes (500 pages) | 0 | Up to 3,000 rows |
| Total worst-case duration | ~42 min | ~5 hours |

### Product Discovery (maxProducts=5000)

| Metric | Current | After Change |
|---|---|---|
| Listing page fetch | 15s timeout | 180s worst case |
| Pagination page fetch | 15s timeout | 180s worst case |
| Enrichment fetch | 15s timeout | 180s worst case |
| Total DB writes (extraction_metrics) | 0 | Up to 30,000 rows |

### Detail Extraction (bounded by product count)

| Metric | Current | After Change |
|---|---|---|
| Per product | 15s timeout | 180s worst case |
| DB writes (extraction_metrics) | 0 | Up to 6 per product |

---

## 9. Files Requiring Modification

| File | Line(s) | Change Required |
|---|---|---|
| `src/discovery/page-extractor.ts` | 15 (import), 261 | Add `import { extractWithRecovery }`, replace `fetchText(url)` with `extractWithRecovery(url)` + unwrap |
| `src/discovery/detail-extraction-engine.ts` | 16 (import), 109 | Add `import { extractWithRecovery }`, replace `fetchText(url)` with `extractWithRecovery(url)` + unwrap |
| `src/discovery/product-discovery-engine.ts` | 16 (import), 135, 163 | Add `import { extractWithRecovery }`, replace `fetchText()` calls + unwrap |

**Total:** 3 files, 6 lines modified, 3 import additions.

---

## 10. Database Schema Changes

| Change | Required? |
|---|---|
| New tables | No — `extraction_metrics` already exists (db.ts:417) |
| Modified tables | No |
| New columns | No |
| Schema migration | No |

**However:** `extraction_metrics` table will receive significantly more rows (0 → thousands per pipeline run).

---

## 11. API Changes

| Change | Required? |
|---|---|
| New endpoints | No |
| Modified request/response formats | No |
| New required parameters | No |
| New optional parameters | No |
| Response time increase | **YES** — worst case 12× longer |

---

## 12. Dashboard Changes

| Change | Required? |
|---|---|
| Dashboard code changes | No |
| Dashboard data changes | **YES** — `extraction_metrics` will contain new rows from Discovery/Product Discovery; recovery metrics will show engine distribution across all pipelines, not just Detail Extraction |

---

## 13. CMS Changes

| Change | Required? |
|---|---|
| CMS code changes | No |
| CMS output changes | **YES** — Different HTML content → different page titles, descriptions, brands, categories, collections, search index entries |

---

## 14. Layer Boundaries

| Boundary | Status |
|---|---|
| Discovery Engine (Layer 2) calling Extraction Manager (Layer 3) | **NEW DEPENDENCY** — Currently Discovery never imports from `extraction/`. After change, `page-extractor.ts` imports from `extraction/extraction-manager.ts`. |
| Architecture Lock | **VIOLATION** — `architecture-lock.json:47` forbids "Modify existing source code in src/"; `architecture-lock.json:55` forbids "Change Discovery Engine logic"; `architecture-lock.json:56` forbids "Change Extraction Engine logic". |
| Extraction Engine | **VIOLATION** — `architecture-lock.json:56` forbids "Change Extraction Engine logic". Modifying `detail-extraction-engine.ts` is an Extraction Engine logic change. |

---

## 15. Risk Assessment

### **HIGH**

| Risk Factor | Severity | Evidence |
|---|---|---|
| Architecture Lock violation | HIGH | `architecture-lock.json:47,55,56` explicitly forbids modifying `src/` code, Discovery Engine logic, and Extraction Engine logic |
| Performance degradation | HIGH | 12× worst-case latency increase for Discovery BFS and Product Discovery |
| DB write amplification | HIGH | 0 → 30,000+ rows in `extraction_metrics` per pipeline run |
| HTML content mutation | HIGH | JCodesMore and Firecrawl mutate HTML — downstream parsers receive different content |
| Double transform | MEDIUM | `prepareHtmlForExtraction()` duplicates JCodesMore transforms for EP-3 |
| Return type incompatibility | MEDIUM | `string \| null` vs `ExtractionEngineResult` — all 5 callers need adaptation |
| CMS output drift | MEDIUM | Different HTML → different CMS pages, brands, collections |
| User-Agent change | LOW | Sites that block bots may respond differently |

---

## 16. Final Decision

**ARCHITECTURE CONFLICT**

The repair cannot be performed as described because:

1. **Architecture Lock explicitly forbids it.** `policies/architecture-lock.json:47` states `"Modify existing source code in src/"` is forbidden. Lines 55-56 forbid `"Change Discovery Engine logic"` and `"Change Extraction Engine logic"`. Replacing `fetchText()` with `extractWithRecovery()` in `page-extractor.ts`, `detail-extraction-engine.ts`, and `product-discovery-engine.ts` violates all three rules.

2. **The Extraction Manager's "Chrome DevTools MCP" engine is itself `fetchText()`.** `extraction-manager.ts:45` calls `fetchText(url)` inside `fetchWithChromeDevTools()`. Replacing `fetchText()` with `extractWithRecovery()` would create a **circular dependency**: `fetchText()` → `extractWithRecovery()` → `fetchWithChromeDevTools()` → `fetchText()`.

3. **The engine chain returns mutated HTML.** JCodesMore applies `expandHiddenContent()` and `extractLazyContent()` transforms. Firecrawl appends JSON-LD and noscript content. This changes the HTML content received by all downstream parsers, potentially altering every extracted field (titles, descriptions, specifications, images, schema, SEO) and cascading through CMS generation.

4. **Performance impact is unacceptable for Discovery BFS.** Discovery processes up to 500 pages with concurrency of 5. Current worst case: ~42 minutes. After change: ~5 hours. This makes the Discovery pipeline impractical for production use.

To properly integrate the engine chain into Discovery, the architecture lock rules would need to be amended first, the circular dependency in `fetchWithChromeDevTools()` would need to be resolved (it must not call `fetchText()`), and the HTML mutation contract would need to be normalized across all engines to return unmodified HTML.
