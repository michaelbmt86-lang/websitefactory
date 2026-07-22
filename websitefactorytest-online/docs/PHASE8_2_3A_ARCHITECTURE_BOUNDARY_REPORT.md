# Phase 8.2.3A: Architecture Boundary Correction Report

## Summary

**Date:** 2026-07-21
**Status:** Complete
**Result:** PASS — Validator and Extraction Manager have strictly separated responsibilities

## Problem Identified

Phase 8.2.3 introduced the Acquisition Validator Plugin with boundary violations:

1. **`ValidationResult.engine: ExtractionEngineName`** — Leaked orchestration knowledge into the validator
2. **`validateAcquisition(html, title, engine)`** — Validator received engine parameter (orchestration concern)
3. **Validator called inside engine functions** — Engine functions (JCodesMore, Firecrawl) were deciding quality, not just fetching HTML

## Architecture Boundary Rules

```
┌─────────────────────────────────────────────────────────────┐
│                   EXTRACTION MANAGER                        │
│  - Orchestrates recovery chain (Chrome → JCodesMore → Fire)│
│  - Calls engine functions to fetch HTML                     │
│  - Calls validator to evaluate quality                      │
│  - Decides: PASS → return, FAIL → try next engine          │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│    ENGINE FUNCTIONS     │    │    ACQUISITION VALIDATOR │
│  - Fetch HTML only      │    │  - Evaluate quality only │
│  - No validation        │    │  - No orchestration      │
│  - No decision logic    │    │  - No engine knowledge   │
│  - Return raw HTML      │    │  - Pure function         │
└─────────────────────────┘    └─────────────────────────┘
```

## Changes Made

### 1. `src/types/discovery.ts` — ValidationResult Contract

**Before:**
```typescript
export interface ValidationResult {
  status: "PASS" | "FAIL";
  score: number;
  reason: string;
  engine: ExtractionEngineName;  // ❌ Orchestration leak
  checks: ValidationCheck[];
}
```

**After:**
```typescript
export interface ValidationResult {
  status: "PASS" | "FAIL";
  score: number;
  confidence: number;  // ✅ How confident are we in this assessment?
  reason: string;
  checks: ValidationCheck[];
  // No engine field — validator doesn't know about engines
}
```

### 2. `src/discovery/extraction/acquisition-validator.ts` — Pure Function

**Before:**
```typescript
export function validateAcquisition(
  html: string,
  title: string | null,
  engine: ExtractionEngineName,  // ❌ Orchestration parameter
  config: ValidatorConfig = DEFAULT_VALIDATOR_CONFIG
): ValidationResult {
  // ...
  return { status, score, reason, engine, checks };
}
```

**After:**
```typescript
export function validateAcquisition(
  html: string,
  title: string | null,
  config: ValidatorConfig = DEFAULT_VALIDATOR_CONFIG
): ValidationResult {
  // ...
  const confidence = passedChecks / checks.length;
  return { status, score, confidence, reason, checks };
  // No engine parameter — pure validation
}
```

### 3. `src/discovery/extraction/extraction-manager.ts` — Orchestrator

**Before:**
```typescript
async function fetchWithChromeDevTools(url: string, timeoutMs: number) {
  const html = await fetchRenderedHtml(url, timeoutMs);
  // Engine was responsible for validation ❌
  const validation = validateAcquisition(html, title, engine);
  return { success: validation.status === "PASS", ... };
}
```

**After:**
```typescript
async function fetchWithChromeDevTools(url: string, timeoutMs: number) {
  const html = await fetchRenderedHtml(url, timeoutMs);
  // Engine ONLY fetches HTML ✅
  return { success: true, html, title, ... };
}

// Extraction Manager orchestrates recovery chain
async function extractWithRecovery(url: string, options: ExtractionManagerOptions) {
  for (const engine of engines) {
    const result = await engine.fetchFn(url, timeoutMs);
    
    // Step 2: Validate acquisition quality
    if (result.success && result.html) {
      const validation = validateAcquisition(result.html, result.title);
      
      // Step 3: Decide based on validation
      if (validation.status === "PASS") {
        return result;
      }
      // Validation failed — try next engine
    }
  }
}
```

### 4. `src/discovery/extraction/jcodesmore-engine.ts` — Pure Fetcher

**Before:**
```typescript
import { validateAcquisition } from "./acquisition-validator";

export async function fetchWithJCodesMore(url: string, timeoutMs: number) {
  const html = await fetch(url, { ... });
  const validation = validateAcquisition(html, title, "jcodesmore-browser");  // ❌
  return { success: validation.status === "PASS", ... };
}
```

**After:**
```typescript
import type { ExtractionEngineResult } from "@/types/discovery";

export async function fetchWithJCodesMore(url: string, timeoutMs: number) {
  const html = await fetch(url, { ... });
  // Return raw HTML — Extraction Manager handles validation ✅
  return { success: true, engine: "jcodesmore-browser", html, title, ... };
}
```

### 5. `src/discovery/extraction/firecrawl-engine.ts` — Pure Fetcher

**Before:**
```typescript
import { validateAcquisition } from "./acquisition-validator";

async function fetchViaFirecrawlApi(...) {
  const html = await response.json();
  const validation = validateAcquisition(html, title, "firecrawl");  // ❌
  return { success: validation.status === "PASS", ... };
}
```

**After:**
```typescript
import type { ExtractionEngineResult } from "@/types/discovery";

async function fetchViaFirecrawlApi(...) {
  const html = await response.json();
  // Return raw HTML — Extraction Manager handles validation ✅
  return { success: true, engine: "firecrawl", html, title, ... };
}
```

## Verification Results

### Type Safety
```bash
npm run typecheck
✅ PASS — No TypeScript errors
```

### Build
```bash
npm run build
✅ PASS — Next.js production build successful
```

### Lint
```bash
npm run lint
✅ PASS — No new lint errors (pre-existing _check_db.cjs error only)
```

### Boundary Violations Check
```bash
grep -r "validateAcquisition" src/discovery/extraction/
# Result: Only extraction-manager.ts and index.ts
# ✅ No validation calls in engine functions
```

```bash
grep -r "ExtractionEngineName" src/discovery/extraction/acquisition-validator.ts
# Result: No matches
# ✅ Validator has zero knowledge of engines
```

## Architecture Benefits

1. **Separation of Concerns** — Each component has one responsibility
2. **Testability** — Validator can be tested with any HTML, no engine mocking needed
3. **Extensibility** — New engines don't need to know about validation rules
4. **Maintainability** — Validation logic centralized in one place
5. **Type Safety** — ValidationResult doesn't leak orchestration types

## Files Modified

| File | Change | Lines Changed |
|------|--------|---------------|
| `src/types/discovery.ts` | Removed `engine` field, added `confidence` | 3 |
| `src/discovery/extraction/acquisition-validator.ts` | Removed `engine` parameter, added confidence calc | 15 |
| `src/discovery/extraction/extraction-manager.ts` | Moved validator calls to orchestrator | 40 |
| `src/discovery/extraction/jcodesmore-engine.ts` | Removed validator import and calls | 25 |
| `src/discovery/extraction/firecrawl-engine.ts` | Removed validator import and calls | 30 |

## Conclusion

Phase 8.2.3A successfully corrects the architecture boundaries between the Acquisition Validator and Extraction Manager. The validator is now a pure function with zero knowledge of extraction engines, and the Extraction Manager is the sole orchestrator responsible for calling the validator and making recovery decisions.

---

**Report Generated:** 2026-07-21
**Author:** Claude Code Agent
**Status:** Complete
