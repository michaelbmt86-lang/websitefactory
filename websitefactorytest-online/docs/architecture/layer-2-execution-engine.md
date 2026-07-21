# Layer 2 — Execution Engine

## Layer Name

**Layer 2 — Execution Engine**

## Primary Tool

**OpenCode**

## Purpose

Layer 2 is the central orchestration and execution brain of the Website Factory pipeline. It translates high-level task instructions from Layer 1 (JCodesMore Task Orchestration) into concrete, sequenced operations that invoke Layer 3 subsystems (Extraction Manager, Chrome DevTools MCP, Recovery engines, Gemini Analyzer, SQLite, CMS Generator, Dashboard, GitHub, Vercel, Cloudflare). It owns the full lifecycle of a website cloning task — from receiving a target URL to delivering a deployed, verified production site.

Layer 2 does NOT own data storage, extraction logic, or UI rendering. It is the **conductor** that sequences, monitors, retries, and reports on every operation performed by Layer 3.

---

## Responsibilities

### R1. Execute Workflow

| Attribute | Detail |
|---|---|
| **Purpose** | Load and execute the complete Website Factory workflow, sequencing all phases in order |
| **Input** | Target URL(s), Execution Mode (clone / rebuild / update), Configuration |
| **Output** | Workflow execution context (state machine with current phase, completed steps, pending steps) |
| **Dependencies** | Workflow definitions (SKILL.md, deployment.workflow.json), OpenCode command system |
| **Failure Behaviour** | Abort execution, log failure reason, return execution status with error context |

### R2. Read Website Factory Policies

| Attribute | Detail |
|---|---|
| **Purpose** | Load all policy constraints that govern execution behaviour (retry limits, build gates, repair rules) |
| **Input** | Policy definitions from AGENTS.md, SKILL.md, website-factory.config.json |
| **Output** | Active policy context applied to current execution |
| **Dependencies** | AGENTS.md, .claude/skills/clone-website/SKILL.md, website-factory.config.json |
| **Failure Behaviour** | Use default policies if specific policy files are missing; log warning |

### R3. Load Workflow

| Attribute | Detail |
|---|---|
| **Purpose** | Parse the workflow definition and prepare execution state for each phase |
| **Input** | SKILL.md (5-phase clone workflow), deployment.workflow.json (12-step deployment) |
| **Output** | Parsed workflow object with ordered steps, dependencies, and phase boundaries |
| **Dependencies** | .claude/skills/clone-website/SKILL.md, deployment/deployment.workflow.json |
| **Failure Behaviour** | Fail fast with clear error message identifying missing or malformed workflow definition |

### R4. Execute Commands

| Attribute | Detail |
|---|---|
| **Purpose** | Execute individual commands within each workflow phase (npm build, tsc, eslint, git, deploy scripts) |
| **Input** | Command string, working directory, timeout, environment variables |
| **Output** | Command exit code, stdout, stderr |
| **Dependencies** | Node.js runtime, npm, git, tsc, eslint |
| **Failure Behaviour** | Capture error output, trigger retry policy (R6), escalate if retries exhausted |

### R5. Call Layer 3

| Attribute | Detail |
|---|---|
| **Purpose** | Invoke Layer 3 subsystems as needed by the current workflow phase |
| **Input** | Layer 3 subsystem identifier, operation parameters |
| **Output** | Subsystem response (structured data, file artifacts, or status) |
| **Dependencies** | All Layer 3 components: Extraction Manager, Chrome DevTools MCP, Recovery engines, Gemini Analyzer, SQLite, CMS Generator, Dashboard, GitHub, Vercel, Cloudflare |
| **Failure Behaviour** | Log subsystem failure, attempt recovery via R7, escalate if unrecoverable |

**Layer 3 Call Map:**

| Layer 3 Component | When Called (Phase) | Purpose |
|---|---|---|
| Chrome DevTools MCP | Phase 1 Reconnaissance, Phase 3 Extraction | Browser automation for screenshots, CSS extraction, interaction sweep |
| Extraction Manager | Phase 3 Component Extraction | Multi-engine extraction orchestration (Chrome DevTools -> JCodesMore -> Firecrawl) |
| JCodesMore Recovery | Phase 3 (extraction failure) | Fallback extraction when primary engine fails |
| Firecrawl Recovery | Phase 3 (extraction failure) | Second fallback extraction engine |
| Gemini Analyzer | Phase 1, Phase 3 | AI-powered content analysis and classification |
| SQLite | All phases (data persistence) | Store discovered URLs, products, CMS data, verification reports |
| CMS Generator | Phase 4 Post-Build | Generate CMS pages, brands, collections, blog, SEO, search index |
| Dashboard | Phase 4 Post-Build | Admin panel for content management and verification |
| GitHub | Deployment phase | Repository management, code push, webhook creation |
| Vercel | Deployment phase | Project creation, deployment, domain binding, environment variables |
| Cloudflare | Deployment phase | DNS zone management, A/CNAME records, SSL configuration |

### R6. Retry Failed Tasks

| Attribute | Detail |
|---|---|
| **Purpose** | Automatically retry transient failures with exponential backoff |
| **Input** | Failed operation reference, retry count, delay configuration |
| **Output** | Retry result (success after retry, or final failure) |
| **Dependencies** | Retry policy (max attempts, delay, backoff multiplier) from deployment/providers/utils.ts |
| **Failure Behaviour** | After max retries exhausted, mark task as failed, continue with next task if possible |

### R7. Resume Interrupted Tasks

| Attribute | Detail |
|---|---|
| **Purpose** | Resume execution from the last completed step after interruption (network failure, user abort, crash) |
| **Input** | Execution state (completed steps, pending steps, partial artifacts) |
| **Output** | Resumed execution context |
| **Dependencies** | Execution state persistence (docs/discovery/ JSON files, database state) |
| **Failure Behaviour** | If state is unrecoverable, restart from beginning with warning |

### R8. Generate Reports

| Attribute | Detail |
|---|---|
| **Purpose** | Produce structured reports at each phase boundary and at completion |
| **Input** | Execution state, step results, timing data, error logs |
| **Output** | Phase reports (discovery, extraction, CMS, verification, delivery), execution timeline |
| **Dependencies** | docs/discovery/ output files, reports/ directory, deployment/deliveryReportArchive.ts |
| **Failure Behaviour** | Report generation failure is logged but does not abort execution |

### R9. Repair

| Attribute | Detail |
|---|---|
| **Purpose** | Auto-detect and fix issues found during verification (missing assets, broken links, schema errors) |
| **Input** | Verification/audit report with identified issues |
| **Output** | Repair report with fixed issues and remaining unfixable items |
| **Dependencies** | src/discovery/verification/repair-engine.ts, audit-engine.ts |
| **Failure Behaviour** | Log unfixable issues, continue execution; manual intervention flag for critical failures |

### R10. Build

| Attribute | Detail |
|---|---|
| **Purpose** | Execute production build and verify it passes |
| **Input** | Source code state (all components merged, types correct) |
| **Output** | Build result (success/failure), build artifacts |
| **Dependencies** | `npm run build` (Next.js 16 production build), TypeScript compiler, ESLint |
| **Failure Behaviour** | Capture build errors, attempt auto-fix for known patterns, fail build gate if unresolved |

### R11. Test

| Attribute | Detail |
|---|---|
| **Purpose** | Run validation checks to verify correctness (typecheck, lint, build) |
| **Input** | Source code, configuration |
| **Output** | Test results (pass/fail per check type) |
| **Dependencies** | `npm run lint`, `npm run typecheck`, `npm run build` |
| **Failure Behaviour** | Log failing checks with file/line references, block deployment until all checks pass |

### R12. Commit

| Attribute | Detail |
|---|---|
| **Purpose** | Create git commits at phase boundaries and completion |
| **Input** | Changed files, commit message, branch |
| **Output** | Git commit hash, branch state |
| **Dependencies** | Git CLI, working tree state |
| **Failure Behaviour** | If pre-commit hooks reject, fix issues and retry commit |

### R13. Return Execution Status

| Attribute | Detail |
|---|---|
| **Purpose** | Provide Layer 1 with complete execution status including all phase results |
| **Input** | Full execution state (all phases, all steps, all results) |
| **Output** | Execution status object (success/failure, duration, phase results, artifact paths, URLs) |
| **Dependencies** | Accumulated state from all prior responsibilities |
| **Failure Behaviour** | Always returns status, even on failure (partial results included) |

---

## Inputs

| Input | Description | Source |
|---|---|---|
| Target URL | The website URL(s) to clone | Layer 1 (JCodesMore) via CLI arguments |
| Target Domain | The target domain name for the cloned site | Derived from URL |
| Execution Mode | clone / rebuild / update | Layer 1 or user configuration |
| Configuration | Factory settings, provider tokens, feature flags | website-factory.config.json, .env |
| Policies | Retry rules, build gates, repair policies | AGENTS.md, SKILL.md |
| Workflow | Phase definitions, step ordering, dependencies | SKILL.md, deployment.workflow.json |

---

## Outputs

| Output | Description | Destination |
|---|---|---|
| Execution Result | Final pass/fail status with phase-by-phase breakdown | Layer 1 (JCodesMore) |
| Delivery Report | 19-check verification report with deployment details | reports/ directory, console |
| Verification Report | Page/product/media/link/SEO/schema verification results | docs/discovery/verification-report.json |
| Timeline | Execution timeline with per-step duration | docs/discovery/execution-timeline.json |
| Git Commit | Version-controlled snapshot of completed work | GitHub repository |
| Deployment URL | Live production URL of the cloned site | Layer 1 report |
| Dashboard URL | Admin panel URL for content management | Layer 1 report |
| Artifacts | Screenshots, extracted data, CMS content, repair reports | docs/research/, docs/discovery/, public/ |

---

## Execution Phases

### Phase 1: Reconnaissance
- Browser automation via Chrome DevTools MCP
- Global extraction (fonts, colors, favicons, UI patterns)
- Interaction sweep (scroll, click, hover, responsive)
- Page topology mapping

### Phase 2: Foundation Build
- Font configuration in layout.tsx
- Color tokens in globals.css
- TypeScript type definitions
- SVG icon extraction
- Asset download script generation and execution

### Phase 3: Component Specification & Dispatch
- Per-section CSS extraction via browser MCP
- Component spec file generation (docs/research/components/)
- Builder agent dispatch in worktrees (parallel)
- Worktree merge and build verification

### Phase 4: Page Assembly & Post-Build
- Wire components into page.tsx
- CMS content generation
- Database seeding
- Dashboard configuration

### Phase 5: Visual QA & Delivery
- Side-by-side comparison screenshots
- Verification pipeline (10 verifiers)
- Audit and repair cycle
- Deployment (12-step workflow)
- 19-check delivery verification
- Delivery report archival
