# ANALYZER PROVIDER NAME PATCH REPORT

**Date:** 2026-07-22
**Status:** PATCHED

---

## Files Modified

| File | Change |
|------|--------|
| `src/discovery/adapters/regex-analyzer.ts:14` | `name: "regex-analyzer"` → `name: "regex"` |

**No other files modified.**

---

## Before/After Provider Name

**Before:**
```ts
// adapters/regex-analyzer.ts
export const regexAnalyzerAdapter: AnalyzerAdapter = {
  name: "regex-analyzer",  // ← mismatch with config "regex"
```

**After:**
```ts
// adapters/regex-analyzer.ts
export const regexAnalyzerAdapter: AnalyzerAdapter = {
  name: "regex",  // ← matches config and DEFAULT_PROVIDER
```

**Alignment chain (now consistent):**
```
analyzer.config.json:  "provider": "regex"
analyzer-engine.ts:    DEFAULT_PROVIDER = "regex"
analyzer-config.ts:    getAnalyzerProvider() → "regex"
regex-analyzer.ts:     name: "regex"          ← FIXED
registry.getAdapter("regex") → FOUND          ← NOW WORKS
```

---

## Build Result

```
npm run build: PASS (Next.js 16.2.1 Turbopack, 82 pages generated)
```

---

## Typecheck Result

```
npm run typecheck: PASS (tsc --noEmit, no errors)
```

---

## Verification

The analyzer engine now resolves the regex adapter correctly:
1. Config reads `"provider": "regex"` → `activeProviderName = "regex"`
2. `analyzerRegistry.getAdapter("regex")` → returns `regexAnalyzerAdapter`
3. `adapter.analyze(input)` → executes regex/heuristic analysis
4. No error thrown — extraction pipeline proceeds normally
