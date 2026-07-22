# ANALYZER DATA GOVERNANCE PHASE 4.1 REPORT

**Date:** 2026-07-15
**Status:** PATCHED
**Scope:** Minimal write-protection patch for SQLite write decision logic

---

## 1. Files Modified

| File | Change |
|---|---|
| src/discovery/detail-extraction-engine.ts | SQL CASE WHEN for 7 protected fields |
| src/discovery/extraction-with-recovery.ts | SQL CASE WHEN for 7 protected fields (identical patch) |

**No other files modified.**

---

## 2. Before/After Write Logic

### BEFORE (Unprotected)

All analyzer output overwrites DB unconditionally:

`sql
subcategory = ?,
brand = ?,
model = ?,
sku = ?,
specifications_json = ?,
related_products_json = ?,
faq_json = ?
`

Parameters: Always analyzer output, even if empty.

### AFTER (Write-Protected)

Analyzer output only overwrites non-empty values:

`sql
subcategory = CASE WHEN ? != '' THEN ? ELSE subcategory END,
brand = CASE WHEN ? != '' THEN ? ELSE brand END,
model = CASE WHEN ? != '' THEN ? ELSE model END,
sku = CASE WHEN ? != '' THEN ? ELSE sku END,
specifications_json = CASE WHEN ? != '[]' THEN ? ELSE specifications_json END,
related_products_json = CASE WHEN ? != '[]' THEN ? ELSE related_products_json END,
faq_json = CASE WHEN ? != '[]' THEN ? ELSE faq_json END
`

Parameters: Analyzer output passed twice (condition + value). If empty, existing DB value preserved.

---

## 3. Protected Fields

### HIGH RISK (Full Replacement -> Conditional Write)

| Field | Condition | Behavior |
|---|---|---|
| specifications_json | specsJson != '[]' | Only overwrite if analyzer produced specs |
| related_products_json | relatedJson != '[]' | Only overwrite if analyzer produced related |
| faq_json | faqJson != '[]' | Only overwrite if analyzer produced FAQ |

### MEDIUM RISK (No Fallback -> Conditional Write)

| Field | Condition | Behavior |
|---|---|---|
| subcategory | analyzer.subcategory != '' | Only overwrite if analyzer produced value |
| brand | analyzer.brand != '' | Only overwrite if analyzer produced value |
| model | analyzer.model != '' | Only overwrite if analyzer produced value |
| sku | analyzer.sku != '' | Only overwrite if analyzer produced value |

### UNCHANGED (Already Safe)

| Field | Logic | Status |
|---|---|---|
| title | analyzer.title \|\| dom.title | No change (already has fallback) |
| subtitle | analyzer.subtitle \|\| dom.subtitle | No change |
| description | analyzer.description \|\| dom.description | No change |
| short_description | analyzer.shortDesc \|\| dom.shortDesc | No change |
| category | analyzer.category \|\| "Unknown" | No change |
| images_json | dom.images only | No change (bypasses analyzer) |
| gallery_json | dom.images only | No change |
| downloads_json | dom.downloads only | No change |
| seo_json | dom.seo only | No change |
| schema_json | dom.schema only | No change |

---

## 4. Build Result

`
npm run typecheck: PASS (tsc --noEmit, no errors)
npm run build: PASS (Next.js 16.2.1 Turbopack, 82 pages generated)
`

---

## 5. Typecheck Result

`
> ai-website-clone-template@0.3.1 typecheck
> tsc --noEmit

(no output = no errors)
`

---

## 6. Architecture Confirmation

- [x] SQLite schema UNCHANGED (no new columns, no table modifications)
- [x] CMS Generator UNCHANGED (reads same fields)
- [x] GeminiInput interface UNCHANGED
- [x] GeminiOutput interface UNCHANGED
- [x] AnalyzerAdapter interface UNCHANGED
- [x] Provider Registry UNCHANGED
- [x] Regex adapter UNCHANGED
- [x] Gemini adapter UNCHANGED
- [x] Extraction engines UNCHANGED (only SQL write logic modified)
- [x] Dashboard UNCHANGED
- [x] Deployment UNCHANGED
- [x] API contracts UNCHANGED

---

## 7. Data Flow After Patch

`
Extraction -> Analyzer -> Write Decision -> SQLite

Text fields (title, subtitle, description, short_description, category):
  analyzer.value || dom.value  (analyzer preferred, DOM fallback)
  -> UNCHANGED from before

Protected fields (brand, model, sku, subcategory):
  analyzer.value != '' ? analyzer.value : KEEP DB VALUE
  -> NEW: empty analyzer output no longer destroys extraction data

Array fields (specifications, faq, related_products):
  analyzer.value != [] ? analyzer.value : KEEP DB VALUE
  -> NEW: empty analyzer output no longer destroys extraction data

Safe fields (images, seo, schema):
  dom.value only
  -> UNCHANGED from before
`

---

## 8. Summary

The minimal write-protection patch ensures that:

1. Analyzer output ONLY overwrites DB when it has actual data
2. Empty analyzer output preserves existing extraction facts
3. No schema changes required
4. No API contract changes
5. No architecture changes
6. Both extraction engines patched identically
7. Backward compatible with existing data
