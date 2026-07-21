# Layer 4 — Browser Extraction Layer

## Layer Name

**Layer 4 — Browser Extraction Layer**

## Primary Purpose

Layer 4 Browser Extraction Layer is the webpage acquisition subsystem of the Website Factory pipeline. It is responsible ONLY for browser interaction and webpage acquisition. It manages browser sessions, navigates to URLs, captures DOM content, handles dynamic rendering, discovers assets, monitors browser health, and reports browser-level metrics.

Layer 4 does NOT own Workflow, Execution, SQLite, CMS, Dashboard, Deployment, Verification, or Gemini Analysis. It is the **browser hands** that acquire raw HTML content for Layer 3 to orchestrate.

---

## Browser Engine Registry

```
Primary: Chrome DevTools MCP (Browser API — real browser interaction)
    ↓ (on failure)
Recovery Level 1: JCodesMore Browser (Browser-like headers fetch)
    ↓ (on failure)
Recovery Level 2: Firecrawl (API or fallback parser)
    ↓ (on failure)
Terminal failure — return failure to Layer 3
```

**Critical Constraint:** Firecrawl must NEVER become primary. Engine priority is FIXED and cannot be reordered. Layer 4 does not make engine selection decisions — it executes the engine that Layer 3 specifies.

---

## Responsibilities

### R1. Launch Browser Session

| Attribute | Detail |
|---|---|
| **Purpose** | Initialize a browser session for a given engine |
| **Input** | Engine name, session configuration (timeout, user agent, viewport) |
| **Output** | BrowserSession with session ID, engine reference, status |
| **Dependencies** | Engine registry (Chrome DevTools MCP, JCodesMore, Firecrawl) |
| **Failure Behaviour** | Return session failure to Layer 3; do not retry (Layer 3 owns retry) |

### R2. Navigate to URL

| Attribute | Detail |
|---|---|
| **Purpose** | Navigate the browser session to a target URL |
| **Input** | URL, navigation options (timeout, wait strategy, redirect policy) |
| **Output** | NavigationResult with status, final URL, response code |
| **Dependencies** | BrowserSession from R1 |
| **Failure Behaviour** | Return navigation failure to Layer 3 with failure reason |

### R3. Capture DOM Content

| Attribute | Detail |
|---|---|
| **Purpose** | Extract the full DOM/HTML content from the current page |
| **Input** | BrowserSession, capture options (depth, include scripts, include styles) |
| **Output** | Raw HTML string, page title, content length |
| **Dependencies** | BrowserSession from R1, NavigationResult from R2 |
| **Failure Behaviour** | Return capture failure if DOM is empty or inaccessible |

### R4. Handle Dynamic Rendering

| Attribute | Detail |
|---|---|
| **Purpose** | Prepare HTML for extraction by expanding hidden content, lazy-loaded elements, and dynamic sections |
| **Input** | Raw HTML string |
| **Output** | Processed HTML with hidden content expanded |
| **Dependencies** | `dynamic-renderer.ts` (server-side simulation) |
| **Failure Behaviour** | Return original HTML if processing fails; log warning |

### R5. Discover Page Assets

| Attribute | Detail |
|---|---|
| **Purpose** | Identify and catalog assets on the page (images, videos, downloads, scripts) |
| **Input** | Raw HTML, base URL |
| **Output** | AssetManifest with categorized asset URLs and metadata |
| **Dependencies** | DOM parsing, URL normalization |
| **Failure Behaviour** | Return partial asset list; log missing asset categories |

### R6. Handle Lazy Loading

| Attribute | Detail |
|---|---|
| **Purpose** | Trigger lazy-loaded content by converting data-src to src, expanding noscript tags, and removing lazy-load constraints |
| **Input** | Raw HTML string |
| **Output** | HTML with lazy-loaded content materialized |
| **Dependencies** | HTML string processing |
| **Failure Behaviour** | Return original HTML; log lazy-load expansion failures |

### R7. Expand Hidden Content

| Attribute | Detail |
|---|---|
| **Purpose** | Remove display:none, height:0, visibility:hidden, and aria-hidden constraints from product sections |
| **Input** | Raw HTML string |
| **Output** | HTML with hidden content expanded |
| **Dependencies** | HTML string processing |
| **Failure Behaviour** | Return original HTML; log expansion failures |

### R8. Manage Browser Recovery

| Attribute | Detail |
|---|---|
| **Purpose** | Handle browser-level failures (timeout, crash, navigation error) and report to Layer 3 |
| **Input** | Browser failure event, session context |
| **Output** | RecoveryEvent with failure type, severity, recommended action |
| **Dependencies** | BrowserSession health monitoring |
| **Failure Behaviour** | Log recovery event; return to Layer 3 for engine switching decision |

### R9. Monitor Browser Health

| Attribute | Detail |
|---|---|
| **Purpose** | Track browser session health metrics (response times, error rates, memory usage) |
| **Input** | Browser session events, navigation results |
| **Output** | BrowserHealthStatus with health score, error distribution, uptime |
| **Dependencies** | Browser session lifecycle events |
| **Failure Behaviour** | Log health degradation; do not switch engines (Layer 3 owns engine switching) |

### R10. Report Browser Metrics

| Attribute | Detail |
|---|---|
| **Purpose** | Record browser-level performance data for Layer 3 consumption |
| **Input** | Navigation results, capture results, session events |
| **Output** | BrowserMetrics record (navigation time, capture time, success/failure) |
| **Dependencies** | Browser session events |
| **Failure Behaviour** | Log metrics recording failure; do not block extraction |

### R11. Execute Browser Cleanup

| Attribute | Detail |
|---|---|
| **Purpose** | Clean up browser session resources (close tabs, release memory, disconnect) |
| **Input** | BrowserSession |
| **Output** | Cleanup status |
| **Dependencies** | BrowserSession from R1 |
| **Failure Behaviour** | Log cleanup failure; force session termination |

### R12. Validate Browser Output

| Attribute | Detail |
|---|---|
| **Purpose** | Validate that captured HTML meets minimum quality thresholds before returning to Layer 3 |
| **Input** | Raw HTML, content length, page title |
| **Output** | ValidationResult with pass/fail, issues, content metrics |
| **Dependencies** | Content validation rules |
| **Failure Behaviour** | Return validation failure with specific issues; do not return empty/invalid HTML |

### R13. Report Browser Extraction Status

| Attribute | Detail |
|---|---|
| **Purpose** | Return structured browser status to Layer 3 for extraction orchestration |
| **Input** | Browser session results |
| **Output** | BrowserStatusResponse with session health, capture metrics, recovery events |
| **Dependencies** | All R1-R12 outputs |
| **Failure Behaviour** | Return partial status if some metrics unavailable |

---

## Inputs

| Input | Source | Description |
|---|---|---|
| Target URL | Layer 3 | Website URL to navigate to and capture |
| Engine Selection | Layer 3 | Which browser engine to use (Chrome DevTools MCP / JCodesMore / Firecrawl) |
| Navigation Options | Layer 3 | Timeout, wait strategy, redirect policy |
| Session Configuration | Layer 3 | User agent, viewport, cookie policy |
| Capture Options | Layer 3 | DOM depth, include scripts, include styles |

## Outputs

| Output | Destination | Description |
|---|---|---|
| Raw HTML | Layer 3 (Normalize R6) | Captured page content for extraction |
| Page Title | Layer 3 (Normalize R6) | Extracted page title |
| Asset Manifest | Layer 3 (Normalize R6) | Discovered page assets |
| Browser Metrics | Layer 3 (Track R8) | Performance and health data |
| Browser Status | Layer 3 (Report R13) | Session health and recovery events |
| Validation Report | Layer 3 (Validate R7) | Content quality assessment |

---

## Data Flow

```
Layer 3 (Extraction Manager)
    │
    ├─ Engine Selection: Chrome DevTools MCP (Primary)
    │   │
    │   ├─ R1: Launch Session → R2: Navigate → R3: Capture DOM
    │   ├─ R4: Dynamic Rendering → R6: Lazy Loading → R7: Hidden Content
    │   ├─ R5: Asset Discovery → R12: Validate Output
    │   ├─ R9: Monitor Health → R10: Report Metrics
    │   └─ Return Raw HTML + Title + Assets to Layer 3
    │
    ├─ Engine Selection: JCodesMore Browser (Recovery L1)
    │   │
    │   ├─ R1: Launch Session → R2: Navigate (browser-like headers)
    │   ├─ R6: Lazy Loading → R7: Hidden Content Expansion
    │   ├─ R12: Validate Output
    │   └─ Return Raw HTML + Title to Layer 3
    │
    ├─ Engine Selection: Firecrawl (Recovery L2)
    │   │
    │   ├─ R1: Launch Session → R2: Navigate (API or fallback parser)
    │   ├─ R5: Asset Discovery (JSON-LD, noscript, meta tags)
    │   ├─ R12: Validate Output
    │   └─ Return Raw HTML + Title to Layer 3
    │
    └─ R8: Browser Recovery (on failure)
        └─ Report failure event to Layer 3 for engine switching
```

---

## Policy Usage

| Policy | Used By | Enforcement |
|---|---|---|
| Engine Priority (engine-priority.json) | R8 Browser Recovery | Layer 3 specifies engine; Layer 4 executes |
| Timeout Policy (timeout-policy.json) | R2 Navigate, R3 Capture | Per-URL timeout enforcement |
| Health Policy (health-policy.json) | R9 Monitor Health | Browser health thresholds |

---

## Recovery Capability

| Scenario | Behaviour |
|---|---|
| Chrome DevTools MCP timeout | Return failure to Layer 3; Layer 3 switches to JCodesMore |
| JCodesMore fetch failure | Return failure to Layer 3; Layer 3 switches to Firecrawl |
| Firecrawl API error | Return failure to Layer 3; Layer 3 records terminal failure |
| Empty DOM capture | R12 validation fails; return validation error to Layer 3 |
| Lazy-load expansion fails | Return original HTML; log warning |
| Hidden content expansion fails | Return original HTML; log warning |
| Browser session crash | R8 recovery reports event; Layer 3 handles engine switching |

---

## Implementation Files

| File | Purpose |
|---|---|
| `src/discovery/extraction/jcodesmore-engine.ts` | Recovery Level 1 — browser-like headers fetch with DOM simulation |
| `src/discovery/extraction/firecrawl-engine.ts` | Recovery Level 2 — Firecrawl API or fallback parser |
| `src/discovery/extraction/extraction-manager.ts` | Engine registry and coordination (primary: Chrome DevTools MCP) |
| `src/discovery/dynamic-renderer.ts` | Server-side DOM manipulation simulation |
| `src/discovery/dom-extractor.ts` | DOM data extraction (title, description, images, specs, SEO, schema, FAQ) |
| `src/types/discovery.ts` | Browser-related type definitions |

---

## Layer Boundary Constraints

| Constraint | Rule |
|---|---|
| **Layer 4 does NOT store data** | All data storage is Layer 3 → SQLite |
| **Layer 4 does NOT generate CMS** | CMS generation is Layer 3 responsibility |
| **Layer 4 does NOT manage Dashboard** | Dashboard is Layer 2 responsibility |
| **Layer 4 does NOT manage Workflow** | Workflow is Layer 2 responsibility |
| **Layer 4 does NOT execute** | Execution is Layer 2 responsibility |
| **Layer 4 does NOT deploy** | Deployment is Layer 2 responsibility |
| **Layer 4 does NOT verify** | Verification is Layer 3 responsibility |
| **Layer 4 does NOT analyze with Gemini** | Gemini analysis is Layer 3 responsibility |
| **Layer 4 does NOT select engines** | Engine selection is Layer 3 responsibility |
| **Layer 4 does NOT retry** | Retry logic is Layer 3 responsibility |
| **Layer 4 does NOT switch engines** | Engine switching is Layer 3 responsibility |
| **Layer 4 DOES acquire webpages** | Browser interaction and HTML capture |
| **Layer 4 DOES prepare HTML** | Dynamic rendering, lazy loading, hidden content |
| **Layer 4 DOES discover assets** | Page asset identification and cataloging |
| **Layer 4 DOES monitor browser health** | Browser session health tracking |
| **Layer 4 DOES report browser metrics** | Performance data for Layer 3 consumption |
