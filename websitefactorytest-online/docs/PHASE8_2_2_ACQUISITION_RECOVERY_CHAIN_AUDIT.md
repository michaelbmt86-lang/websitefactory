# PHASE 8.2.2 — ACQUISITION RECOVERY CHAIN ARCHITECTURE AUDIT

**READ ONLY — NO CODE MODIFIED — NO COMMITS CREATED**

**Date:** 2026-07-21
**Target:** `sportsgoods.en.alibaba.com`
**Domain:** `websitefactorytest.online`
**Auditor:** OpenCode (read-only analysis)

---

## Purpose

Verify whether the current Website Factory acquisition architecture correctly implements the intended recovery chain:

```
Chrome DevTools MCP
        ↓
JCodesMore Browser
        ↓
Firecrawl
```

Determine why Alibaba CAPTCHA did not trigger the recovery chain.

---

## Execution Trace

### Complete Pipeline Flow

```
Customer
  ↓
CLI (website-factory.ts)
  ↓
Orchestrator (website-factory-orchestrator.ts)
  ↓
Stage 1: Discovery (discovery-engine.ts)
  ↓
Stage 2: Product Discovery (product-discovery-engine.ts)
  ↓
Stage 3: Detail Extraction (extraction-with-recovery.ts)
  ↓
Stage 4: CMS Generator (cms-generator-engine.ts)
  ↓
Stage 5: Verification (verification-engine.ts)
  ↓
Stage 6: Delivery (deploy.ts)
```

### Stage 1: Discovery — What Happened

1. `DiscoveryEngine.discover()` called `fetchRobotsTxt()` → `fetchText()` → `extractWithRecovery()`
2. `extractWithRecovery()` called `fetchWithChromeDevTools()` → `fetchRenderedHtml()`
3. Chrome DevTools MCP opened a new tab, navigated to `https://sportsgoods.en.alibaba.com/robots.txt`
4. Alibaba returned HTTP 200 with CAPTCHA HTML page
5. `fetchRenderedHtml()` executed `evaluate_script` → `document.documentElement.outerHTML` → returned CAPTCHA HTML
6. `fetchWithChromeDevTools()` returned `{ success: true, html: "<CAPTCHA HTML>" }`
7. `extractWithRecovery()` received `success: true` → returned immediately (line 81-84)
8. **Recovery chain NEVER triggered** — JCodesMore and Firecrawl were never called

### Stage 1 Continued: Discovery BFS

9. `DiscoveryEngine.discover()` called `discoverSitemaps()` → tried 6 common sitemap paths
10. Each path went through `fetchText()` → `extractWithRecovery()` → Chrome DevTools MCP → returned CAPTCHA HTML
11. `parseSitemapXml()` received CAPTCHA HTML → found no `<urlset` or `<sitemapindex` → returned empty entries
12. Homepage crawl: `crawlPage()` → `extractPageData()` → `fetchText()` → Chrome DevTools → CAPTCHA HTML
13. `parseHtml()` extracted: `title: "验证码拦截"`, `h1: ""`, `internalLinks: []`, `images: []`
14. Classification: `classifyUrlByPath("/")` → `"Home"` (path-based, not content-based)
15. `site_urls` table: 1 row with `title: "验证码拦截"`, `internal_links: 0`, `images: 0`
16. BFS found 0 internal links → crawl terminated

### Stage 2: Product Discovery

17. `ProductDiscoveryEngine.discover()` read `site_urls` (1 row)
18. Classification: `page_type: "Home"` → not a product → `isProduct: false`
19. `product_urls` table: 0 rows

### Stage 3: Detail Extraction

20. `RecoveryExtractionEngine.extract()` read `product_urls` → 0 products
21. No extraction attempted → `extracted_products` table: 0 rows

### Stage 4: CMS Generator

22. `CmsGeneratorEngine` read `site_urls` (1 row) + `extracted_products` (0 rows)
23. Generated: 4 pages, 3 blog posts (from SQLite seed data)

### Stage 5: Verification

24. Verification ran 5/10 checks (skipped products, media, etc. due to 0 products)
25. No verification report for `sportsgoods.en.alibaba.com` (only `solidhydrogen.tech` and `biopak.com` in DB)

---

## Recovery Chain Trace

### Engine Registry

```
File: src/discovery/extraction/extraction-manager.ts:55-62
Function: getEngineConfigs()

Engine 1: chrome-devtools-mcp  → fetchWithChromeDevTools  (maxRetries: 2)
Engine 2: jcodesmore-browser    → fetchWithJCodesMore      (maxRetries: 2)
Engine 3: firecrawl             → fetchWithFirecrawl        (maxRetries: 2)
```

### Recovery Logic

```
File: src/discovery/extraction/extraction-manager.ts:67-107
Function: extractWithRecovery()

for each engine:
  for attempt 1..maxRetries:
    result = engine.fetchFn(url, timeoutMs)
    if (result.success === true)  ← LINE 81
      recordMetric(...)
      return result               ← LINE 84 — IMMEDIATE RETURN
    else:
      lastError = result.error
      delay before retry
  engine exhausted → record failure

all engines exhausted → return { success: false }
```

### Why Recovery Never Triggered

**Chrome DevTools returned `success: true` with CAPTCHA HTML.**

The recovery chain logic at line 81 checks ONLY `result.success`:

```typescript
if (result.success) {
  recordMetric(url, engine.name, engine.name, totalAttempts, Date.now() - startTime, null, "success");
  return result;  // ← IMMEDIATE RETURN — JCodesMore and Firecrawl NEVER called
}
```

Since `fetchWithChromeDevTools()` returned `{ success: true, html: "<CAPTCHA HTML>" }`, the loop broke on the first engine and returned.

---

## Q1: Does an Acquisition Validator Already Exist?

### Answer: **NO**

### Search Results

Searched entire `src/` directory for:
- `captcha`, `CAPTCHA`
- `challenge`, `verification.*required`
- `robot.*check`, `cloudflare.*challenge`
- `js.*challenge`, `access.*denied`
- `human.*verification`, `blocked`, `forbidden`
- `validator`, `validate.*extraction`, `validate.*content`, `validate.*acquisition`
- `content.*quality`, `quality.*check`

### What Was Found

| Component | File | Purpose | Validates Acquisition? |
|-----------|------|---------|----------------------|
| `quality-validator.ts` | `src/discovery/quality-validator.ts` | Validates extracted product data (missing images, SEO, duplicates) | **NO** — post-extraction only |
| `cms-quality-validator.ts` | `src/discovery/cms/cms-quality-validator.ts` | Validates CMS pages (empty descriptions, duplicate slugs) | **NO** — post-CMS only |
| `page-classifier.ts` | `src/discovery/page-classifier.ts` | Classifies URLs by path patterns (Login, Dashboard, etc.) | **NO** — path-based only, no content validation |
| `analysis-context.ts` | `src/discovery/analysis/analysis-context.ts:184-194` | Defines "quality-validator" component metadata | **NO** — metadata only, no acquisition validation |

### Conclusion

**No component exists that validates acquired content for CAPTCHA, challenge pages, robot detection, empty content, placeholder pages, login pages, suspicious HTML, or content quality BEFORE the success flag is set.**

---

## Q2: Chrome DevTools MCP Success Criteria

### Answer: **Success = HTML exists (non-empty)**

### Code Trace

**Function: `fetchWithChromeDevTools()`**
- File: `src/discovery/extraction/extraction-manager.ts:40-49`
- Calls `fetchRenderedHtml(url, timeoutMs)`
- If no exception thrown → returns `{ success: true, html, title }`
- If exception thrown → returns `{ success: false, error: message }`

**Function: `fetchRenderedHtml()`**
- File: `src/lib/mcp-client.ts:59-120`
- Step 1: `c.callTool({ name: "new_page", arguments: { url, timeout } })` — opens tab
- Step 2: `c.callTool({ name: "evaluate_script", arguments: { function: "() => document.documentElement.outerHTML" } })` — gets DOM
- Success criteria (lines 97-104):
  ```typescript
  if (!jsContent || !Array.isArray(jsContent) || jsContent.length === 0) {
    throw new Error("evaluate_script returned empty content");
  }
  const html = (jsContent[0] as { type: string; text?: string }).text ?? "";
  if (!html || html.trim().length === 0) {
    throw new Error("Rendered HTML was empty");
  }
  return html;
  ```

### Success Criteria Summary

| Check | Condition | Line |
|-------|-----------|------|
| Content exists | `jsContent` is array with length > 0 | mcp-client.ts:97-99 |
| HTML non-empty | `html.trim().length > 0` | mcp-client.ts:102-104 |
| No exception | `fetchRenderedHtml()` didn't throw | extraction-manager.ts:43-46 |

### What Is NOT Checked

- ❌ Content quality
- ❌ Product count
- ❌ Useful links
- ❌ DOM completeness
- ❌ CAPTCHA detection
- ❌ Challenge page detection
- ❌ Login page detection
- ❌ Blocked page detection

---

## Q3: CAPTCHA Detection

### Answer: **NO CAPTCHA detection exists anywhere in the codebase**

### Search Results

Searched entire `src/` directory for:
- `captcha`, `CAPTCHA`
- `challenge`
- `verification.*required`
- `robot.*check`
- `cloudflare.*challenge`
- `js.*challenge`
- `access.*denied`
- `human.*verification`
- `blocked`
- `forbidden`

**Result: No matches found in any extraction, recovery, or validation code.**

### What Would Be Needed

CAPTCHA detection patterns that should be checked:
- Chinese: `验证码拦截`, `验证码`, `请完成安全验证`
- English: `captcha`, `verify you are human`, `robot check`, `challenge`
- Cloudflare: `cf-browser-verification`, `challenge-platform`
- Generic: `access denied`, `forbidden`, `blocked`

---

## Q4: Recovery Trigger Logic

### Answer: Recovery is triggered ONLY when `result.success === false`

### Complete Flow

```
extractWithRecovery(url)
  │
  ├─ Engine 1: fetchWithChromeDevTools(url)
  │    │
  │    ├─ fetchRenderedHtml(url)
  │    │    ├─ new_page(url) → opens tab
  │    │    ├─ evaluate_script() → gets HTML
  │    │    └─ returns html string
  │    │
  │    └─ returns { success: true, html }  ← IF NO EXCEPTION
  │
  ├─ if (result.success === true) → RETURN IMMEDIATELY
  │    └─ JCodesMore: NEVER CALLED
  │    └─ Firecrawl: NEVER CALLED
  │
  ├─ Engine 2: fetchWithJCodesMore(url)  ← ONLY IF Engine 1 failed
  │    │
  │    ├─ fetch(url, { headers }) → HTTP fetch
  │    ├─ expandHiddenContent(html) → DOM simulation
  │    ├─ extractLazyContent(html) → lazy loading
  │    └─ hasMinimalContent check (text > 200 chars)
  │
  ├─ if (result.success === true) → RETURN IMMEDIATELY
  │    └─ Firecrawl: NEVER CALLED
  │
  └─ Engine 3: fetchWithFirecrawl(url)  ← ONLY IF Engine 1+2 failed
       │
       ├─ Firecrawl API (if API key available)
       └─ Fallback: multiple User-Agent HTTP fetch
```

### Why Alibaba Never Reached JCodesMore

1. Chrome DevTools MCP navigated to `https://sportsgoods.en.alibaba.com/`
2. Alibaba returned HTTP 200 with CAPTCHA HTML
3. `fetchRenderedHtml()` called `evaluate_script()` → `document.documentElement.outerHTML` → returned CAPTCHA HTML
4. CAPTCHA HTML is non-empty → `fetchRenderedHtml()` returned the HTML string
5. `fetchWithChromeDevTools()` received HTML → no exception → returned `{ success: true, html: "<CAPTCHA HTML>" }`
6. `extractWithRecovery()` checked `result.success === true` → returned immediately
7. **JCodesMore was never called**

### Why Alibaba Never Reached Firecrawl

Same reason — Chrome DevTools reported success, so the loop never progressed to Engine 2 or Engine 3.

---

## Q5: JCodesMore Invocation

### Answer: Called ONLY from `extractWithRecovery()` when Chrome DevTools fails

### Locations

| Caller | File | Line | Condition |
|--------|------|------|-----------|
| `extractWithRecovery()` | `src/discovery/extraction/extraction-manager.ts:59` | Engine registry | Only when Engine 1 (Chrome) returns `success: false` |

### Can It Execute If Chrome Returned `success: true`?

**NO.** The recovery loop at lines 76-95 breaks on first `success: true`:

```typescript
for (const engine of engines) {
  for (let attempt = 1; attempt <= engine.maxRetries; attempt++) {
    const result = await engine.fetchFn(url, options.timeoutMs ?? 30000);
    if (result.success) {
      return result;  // ← IMMEDIATE EXIT
    }
  }
}
```

JCodesMore is Engine 2 (index 1). It can only execute if Engine 1 (Chrome) exhausted all retries with `success: false`.

---

## Q6: Firecrawl Invocation

### Answer: Called ONLY from `extractWithRecovery()` when BOTH Chrome AND JCodesMore fail

### Locations

| Caller | File | Line | Condition |
|--------|------|------|-----------|
| `extractWithRecovery()` | `src/discovery/extraction/extraction-manager.ts:60` | Engine registry | Only when Engine 1+2 return `success: false` |

### Can It Execute If Chrome Returned `success: true`?

**NO.** Same reason as JCodesMore — the loop breaks on first `success: true`.

---

## Q7: SQLite Evidence

### extraction_metrics Table

```json
{
  "id": 579,
  "url": "https://sportsgoods.en.alibaba.com/",
  "primary_engine": "chrome-devtools-mcp",
  "successful_engine": "chrome-devtools-mcp",
  "attempts": 1,
  "duration_ms": 3141,
  "failure_reason": null,
  "status": "success"
}
```

**All 10 extraction metrics show:**
- `successful_engine: "chrome-devtools-mcp"`
- `status: "success"`
- `attempts: 1`
- `failure_reason: null`

**This confirms Chrome DevTools reported success for EVERY URL, including CAPTCHA pages.**

### site_urls Table

```json
{
  "url": "https://sportsgoods.en.alibaba.com/",
  "page_type": "Home",
  "status": "crawled",
  "title": "验证码拦截",
  "internal_links": 0,
  "images": 0
}
```

**SQLite contains EVIDENCE that Chrome captured only a CAPTCHA page:**
- `title: "验证码拦截"` = "CAPTCHA Interception" (Chinese)
- `internal_links: 0` = No navigation links found
- `images: 0` = No images found
- Only 1 URL discovered (homepage only)

### product_urls Table

```json
[]
```

**Empty** — 0 products discovered (expected, since CAPTCHA page had no product links)

### extracted_products Table

```json
[]
```

**Empty** — 0 products extracted (expected, since 0 products were discovered)

### verification_reports Table

**No entry for `sportsgoods.en.alibaba.com`** — only entries for `solidhydrogen.tech` and `biopak.com`

---

## Q8: Root Cause

### **B. Recovery chain works correctly. Chrome incorrectly reported success.**

### Evidence

1. **Recovery chain IS implemented** — `extraction-manager.ts:55-62` defines all 3 engines in priority order
2. **Recovery chain logic IS correct** — `extractWithRecovery()` loops through engines, breaks on first `success: true`
3. **Chrome DevTools MCP returned `success: true`** — because `fetchWithChromeDevTools()` only checks `html.trim().length > 0`
4. **CAPTCHA HTML is non-empty** — Alibaba returned a full HTML page with CAPTCHA challenge
5. **Recovery was NEVER triggered** — because Chrome reported success before content validation could occur
6. **SQLite proves it** — `extraction_metrics` shows all URLs succeeded with Chrome DevTools, `site_urls` shows `title: "验证码拦截"`

### Root Cause Statement

The recovery chain architecture is correct and functional. The failure is that `fetchWithChromeDevTools()` (extraction-manager.ts:40-49) treats ANY non-empty HTML as success, without validating that the HTML contains actual content (not CAPTCHA, challenge pages, login pages, or empty SPA shells).

---

## Q9: Architecture Assessment

### **B. Only an Acquisition Validator Plugin**

### Does NOT Require Architecture Change

The architecture is sound:
- Chrome DevTools MCP → JCodesMore → Firecrawl is the correct priority order
- SQLite as single source of truth is correct
- Recovery chain logic is correct
- Engine registry is correct

### What IS Missing

An **Acquisition Validator** layer that validates content quality BETWEEN the engine response and the success flag.

### Insertion Point

**File:** `src/discovery/extraction/extraction-manager.ts`
**Function:** `fetchWithChromeDevTools()` (lines 40-49)
**Location:** After `fetchRenderedHtml()` returns HTML, BEFORE returning `{ success: true }`

Current code:
```typescript
async function fetchWithChromeDevTools(url: string, timeoutMs: number): Promise<ExtractionEngineResult> {
  const startTime = Date.now();
  try {
    const html = await fetchRenderedHtml(url, timeoutMs);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]+>/g, "") : null;
    return { success: true, engine: "chrome-devtools-mcp", html, title, durationMs: Date.now() - startTime };
    //                                                              ↑
    //                                              INSERT VALIDATION HERE
  } catch (err) {
    return { success: false, ... };
  }
}
```

The Validator should:
1. Check for CAPTCHA patterns in HTML (Chinese/English)
2. Check for challenge page patterns
3. Check for login page patterns
4. Check for empty SPA shells
5. Check for blocked/access denied pages
6. If any check fails → return `{ success: false, error: "CAPTCHA detected" }` → triggers recovery chain

**This is a content validation layer, NOT an architecture change.**

---

## Q10: Architecture Lock Verification

### Architecture Remains Valid

```
Chrome DevTools MCP
        ↓
JCodesMore Browser
        ↓
Firecrawl
        ↓
SQLite
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

### Does the Alibaba Failure Indicate an Architecture Problem?

**NO.** The Alibaba failure indicates a **MISSING VALIDATION COMPONENT**.

The architecture is correct. The implementation is missing a content validation layer that should exist between the engine response and the success determination.

---

## Recommended Action

### **KEEP CURRENT ARCHITECTURE**

### Implementation Required

Add an **Acquisition Validator** function that validates HTML content before the success flag is set.

**Insertion Point:** `src/discovery/extraction/extraction-manager.ts:40-49` — inside `fetchWithChromeDevTools()`

**Validation Checks:**
1. CAPTCHA detection (Chinese: `验证码拦截`, `验证码`; English: `captcha`, `verify you are human`)
2. Challenge page detection (`challenge-platform`, `cf-browser-verification`)
3. Login page detection (`login`, `signin`, `sign-in`)
4. Empty SPA shell detection (minimal HTML, no content)
5. Blocked page detection (`access denied`, `forbidden`, `blocked`)

**Effect:** If validation fails → return `{ success: false }` → recovery chain triggers → JCodesMore → Firecrawl

**Architecture Impact:** NONE — this is a content validation plugin, not an architecture change.

---

## Summary

| Question | Answer |
|----------|--------|
| Q1: Acquisition Validator exists? | **NO** |
| Q2: Chrome success criteria? | **HTML exists (non-empty)** |
| Q3: CAPTCHA detection? | **NONE** |
| Q4: Recovery trigger? | **`result.success === false`** |
| Q5: JCodesMore invocation? | **Only when Chrome fails** |
| Q6: Firecrawl invocation? | **Only when Chrome+JCodesMore fail** |
| Q7: SQLite evidence? | **`title: "验证码拦截"`, `internal_links: 0`, `images: 0`** |
| Q8: Root cause? | **B — Chrome incorrectly reported success** |
| Q9: Architecture assessment? | **B — Only Acquisition Validator needed** |
| Q10: Architecture lock? | **Valid — missing validation component** |

**Recommendation: KEEP CURRENT ARCHITECTURE**
