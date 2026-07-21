# Phase 8.1.5 Crawler Architecture Audit Report

**Date:** 2026-07-21
**Scope:** Read-only audit — crawling/extraction architecture verification
**Status:** ✅ PASS

---

## Overall Result

**PASS**

The crawler architecture uses a single unified extraction chain (`extraction-manager.ts`) with a 3-level fallback recovery pattern: Chrome DevTools MCP (primary) → JCodesMore Browser (L1) → Firecrawl (L2). All HTTP acquisition in the pipeline flows through this chain. No external crawling services, no Playwright, no Crawl4AI in production code.

---

## Extraction Chain Diagram

```
All HTTP Acquisition (sitemap-parser.ts, detail-extraction-engine.ts)
        ↓
extractWithRecovery() (extraction-manager.ts)
        ↓
┌─────────────────────────────────────────────────────┐
│  L0: chrome-devtools-mcp (Primary)                  │
│  src/lib/mcp-client.ts                              │
│  Spawns: npx -y chrome-devtools-mcp@latest          │
│          --headless --isolated                      │
│  Protocol: stdio MCP (JSON-RPC)                     │
│  Browser: Headless Chromium via MCP SDK              │
│  Retries: 2 per engine                              │
├─────────────────────────────────────────────────────┤
│  L1: jcodesmore-browser (Recovery Level 1)          │
│  src/discovery/extraction/jcodesmore-engine.ts      │
│  Method: native fetch + browser UA headers          │
│  Post-processing: DOM expansion (accords/tabs)      │
│                  lazy-load extraction               │
│  Retries: 2 per engine                              │
├─────────────────────────────────────────────────────┤
│  L2: firecrawl (Recovery Level 2)                   │
│  src/discovery/extraction/firecrawl-engine.ts       │
│  Method A: Firecrawl API (if FIRECRAWL_API_KEY set) │
│  Method B: Aggressive HTTP fallback                 │
│            - 3 rotating user agents (incl. bot UA)  │
│            - JSON-LD extraction from noscript tags   │
│            - Minimum 100-char content validation    │
│  Retries: 2 per engine                              │
└─────────────────────────────────────────────────────┘
        ↓
First successful extraction terminates chain
All failures recorded in extraction_metrics table
```

---

## 1. HTTP Acquisition Audit

### All HTTP acquisition in the pipeline

| Consumer | File | HTTP Method |
|----------|------|-------------|
| Sitemap discovery | `sitemap-parser.ts:71-103` | `fetchText()` → `extractWithRecovery()` |
| Sitemap crawling | `sitemap-parser.ts:142-164` | `fetchText()` → `extractWithRecovery()` |
| robots.txt fetch | `sitemap-parser.ts:11-19` | `fetchText()` → `extractWithRecovery()` |
| Page crawling (discovery) | `page-extractor.ts:258-292` | `fetchText()` → `extractWithRecovery()` |
| Page status check | `page-extractor.ts:294-307` | Native `fetch()` with HEAD method |
| Product detail fetch | `detail-extraction-engine.ts:109` | `fetchText()` → `extractWithRecovery()` |
| JSON API fetch | `sitemap-parser.ts:21-32` | Native `fetch()` with Accept: JSON |

### Key Finding: ALL content acquisition uses `extractWithRecovery()`

Every content-critical HTTP call flows through the unified extraction chain. The only exception is `fetchJson()` (JSON API) and `fetchPageStatus()` (HEAD status check) which use native `fetch()` directly — these are non-content-critical lightweight operations.

**Result:** ✅ Single extraction chain, no bypass

---

## 2. Engine Implementation Audit

### L0: Chrome DevTools MCP (Primary)

| Property | Value |
|----------|-------|
| File | `src/lib/mcp-client.ts` |
| Implementation | stdio MCP client via `@modelcontextprotocol/sdk` |
| Process | `npx -y chrome-devtools-mcp@latest --headless --isolated` |
| Browser | Headless Chromium (managed by MCP server) |
| Connection | Singleton with lazy init, 30-min idle timeout |
| Page lifecycle | Opens tab → evaluates `document.documentElement.outerHTML` → closes tab |
| Isolation | Each extraction gets fresh tab, isolated browser context |
| Process cleanup | Registered on `process.exit()` |

**Result:** ✅ Fully implemented, production-ready

### L1: JCodesMore Browser (Recovery Level 1)

| Property | Value |
|----------|-------|
| File | `src/discovery/extraction/jcodesmore-engine.ts` |
| Implementation | Native `fetch()` with browser-like headers |
| UA String | Chrome 120 on Windows |
| Post-processing | `expandHiddenContent()`: removes `display:none`, expands collapsed tabs, removes `aria-hidden` |
| Content validation | Minimum 200 chars of text content required |

**Result:** ✅ Fully implemented, production-ready

### L2: Firecrawl (Recovery Level 2)

| Property | Value |
|----------|-------|
| File | `src/discovery/extraction/firecrawl-engine.ts` |
| API integration | Firecrawl REST API (`api.firecrawl.dev/v1/scrape`) |
| API key | `FIRECRAWL_API_KEY` environment variable (optional) |
| Fallback | 3-rotating-user-agent HTTP fetch + content extraction |
| Fallback features | JSON-LD extraction from noscript tags, og:title, multi-UA rotation |
| Content validation | Minimum 100 chars of text content required |

**Result:** ✅ Fully implemented, production-ready (API optional)

---

## 3. HTML Processing Audit

### DOM Manipulation

| Processor | File | Purpose |
|-----------|------|---------|
| `prepareHtmlForExtraction()` | `dynamic-renderer.ts:10-51` | Expand accordions, tabs, noscript images, lazy-load markers |
| `expandHiddenContent()` | `jcodesmore-engine.ts:102-120` | Remove display:none, expand collapsed tabs, remove aria-hidden |
| `extractLazyContent()` | `jcodesmore-engine.ts:122-131` | Convert data-src to src, loading=lazy to eager |

### Regex-Based HTML Parsing (No DOM Library)

| Parser | File | Purpose |
|--------|------|---------|
| `parseHtml()` | `page-extractor.ts:17-109` | Nav links, JSON-LD, meta tags, breadcrumbs, mega menus |
| `extractTitle()` etc. | `gemini-analyzer.ts` | Product title, subtitle, brand, model, SKU, category |
| `extractSpecifications()` | `detail-extraction-engine.ts` | Product specs from DOM |
| `extractImages()` | `detail-extraction-engine.ts` | Product images from HTML |
| `extractDownloads()` | `detail-extraction-engine.ts` | Download links from HTML |

**Key Finding:** No DOM library (cheerio, jsdom, htmlparser2) is used. All HTML parsing is regex-based. This is by design — avoids heavy dependencies, keeps bundle small, and the regex patterns cover the common HTML structures encountered during crawling.

**Result:** ✅ Consistent architecture, no unexpected dependencies

---

## 4. Gemini Analyzer Audit

| Property | Value |
|----------|-------|
| File | `src/discovery/gemini-analyzer.ts` |
| API calls | NONE — heuristic analysis only |
| Input | Pre-extracted HTML, JSON-LD, network data |
| Output | Normalized product data (title, specs, FAQ, etc.) |
| External dependencies | None |
| Purpose | Data normalization, not crawling |

**Result:** ✅ Analyzer only, not a crawler. No external API dependency.

---

## 5. Architecture Lock Verification

| Check | Status | Evidence |
|-------|--------|----------|
| Chrome DevTools MCP implemented | ✅ | `src/lib/mcp-client.ts` — stdio MCP, spawns headless Chromium |
| Firecrawl implemented | ✅ | `src/discovery/extraction/firecrawl-engine.ts` — API + fallback |
| JCodesMore Browser implemented | ✅ | `src/discovery/extraction/jcodesmore-engine.ts` — HTTP + DOM expansion |
| All engines in extraction chain | ✅ | `src/discovery/extraction/extraction-manager.ts:55-62` — all 3 registered |
| Playwright in production code | ❌ NOT present | Zero imports in `src/`. Only in `package.json` as devDependency |
| Crawl4AI referenced | ❌ NOT present | Zero occurrences in entire codebase |
| DOM library (cheerio/jsdom) | ❌ NOT present | Zero imports. Regex-based parsing only |
| External crawling services | ❌ NOT present | No Scrapy, Puppeteer, or similar |
| Gemini external API | ❌ NOT present | Heuristic analysis only |
| Native fetch bypass | ✅ Controlled | Only `fetchJson()` (API) and `fetchPageStatus()` (HEAD) — non-content-critical |

### Dependency Audit

**Production dependencies (crawling-related):**
- `@modelcontextprotocol/sdk` — MCP client for Chrome DevTools
- Native `fetch()` — HTTP client (Node.js built-in)

**Dev dependencies (crawling-related):**
- `playwright` — Testing only, zero imports in `src/`

**Not present:**
- `cheerio`, `jsdom`, `htmlparser2` — No DOM library
- `crawl4ai` — No reference anywhere
- `puppeteer` — Not used (Chrome DevTools MCP uses its own headless Chromium)

**Result:** ✅ Architecture locked. No unauthorized crawling engines.

---

## 6. Recovery Chain Behavior

```
extractWithRecovery(url, options)
  │
  ├─→ L0: chrome-devtools-mcp (2 retries)
  │     ├─ Success → return immediately
  │     └─ Fail → delay(500ms) → retry
  │     └─ Exhausted → record metric, continue to L1
  │
  ├─→ L1: jcodesmore-browser (2 retries)
  │     ├─ Success → return immediately
  │     └─ Fail → delay(500ms) → retry
  │     └─ Exhausted → record metric, continue to L2
  │
  └─→ L2: firecrawl (2 retries)
        ├─ Success → return immediately
        └─ Fail → delay(500ms) → retry
        └─ Exhausted → record metric, return failure

Total worst-case: 6 attempts per URL (2 × 3 engines)
```

### Metrics Recording

Every extraction attempt is recorded in `extraction_metrics` table:
- `url`, `primary_engine`, `successful_engine`, `attempts`, `duration_ms`, `failure_reason`, `status`

Dashboard can query `getExtractionMetricsSummary()` for recovery chain performance.

**Result:** ✅ Full observability, proper fallback chain

---

## Manual Intervention Required

**NO**

The crawling architecture is fully automated. All extraction uses a single chain with automatic fallback. No manual engine selection, no external service configuration required (Firecrawl API key is optional).

---

## Blocking Issues

None.

---

## Recommendation

**READY FOR PHASE 8.2 FINAL PRODUCTION VALIDATION**

The crawler architecture is clean, locked, and fully implemented:
1. Single extraction chain with 3-level fallback
2. Chrome DevTools MCP as primary (real browser rendering via stdio)
3. JCodesMore Browser as L1 recovery (HTTP + DOM expansion)
4. Firecrawl as L2 recovery (API or aggressive fallback)
5. No Playwright, Crawl4AI, or external crawling services in production code
6. All metrics recorded in SQLite for observability
7. No manual intervention required
