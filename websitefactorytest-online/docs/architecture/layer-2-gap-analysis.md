# Layer 2 — Gap Analysis

**Date:** 2026-07-18
**Comparison:** Layer 2 Specification vs Current Implementation

---

## 1. Already Complete

### R1. Execute Workflow

| Aspect | Status | Evidence |
|---|---|---|
| Clone workflow defined | **Complete** | `.claude/skills/clone-website/SKILL.md` (473 lines, 5-phase workflow) |
| Deployment workflow defined | **Complete** | `deployment/deployment.workflow.json` (12-step deployment) |
| OpenCode command registration | **Complete** | `.opencode/commands/clone-website.md` (auto-generated) |
| Cross-platform skill sync | **Complete** | `scripts/sync-skills.mjs` (9 platforms) |

### R4. Execute Commands

| Aspect | Status | Evidence |
|---|---|---|
| npm scripts (dev/build/lint/typecheck/check) | **Complete** | `package.json` scripts section |
| Git operations | **Complete** | `deployment/providers/github.ts` (createRepo, pushCode, createWebhook) |
| Deployment scripts | **Complete** | `scripts/deploy-direct.mjs`, `deployment/deploy.ts` |

### R5. Call Layer 3

| Aspect | Status | Evidence |
|---|---|---|
| Chrome DevTools MCP integration | **Complete** | `opencode.json` MCP config, SKILL.md references |
| Extraction Manager | **Complete** | `src/discovery/extraction/extraction-manager.ts` |
| Recovery engines | **Complete** | `src/discovery/extraction/jcodesmore-engine.ts`, `firecrawl-engine.ts` |
| Gemini Analyzer | **Complete** | `src/discovery/gemini-analyzer.ts` |
| SQLite database | **Complete** | `src/lib/db.ts` (20+ tables, WAL mode, seeding) |
| CMS Generator | **Complete** | `src/discovery/cms/` (8 generators + quality validator + output generator) |
| Verification system | **Complete** | `src/discovery/verification/` (12 verifiers + audit + repair) |
| Dashboard | **Complete** | `src/app/dashboard/` (30+ pages, full admin panel) |
| GitHub provider | **Complete** | `deployment/providers/github.ts` |
| Vercel provider | **Complete** | `deployment/providers/vercel.ts` |
| Cloudflare provider | **Complete** | `deployment/providers/cloudflare.ts` |

### R8. Generate Reports

| Aspect | Status | Evidence |
|---|---|---|
| Delivery report archival | **Complete** | `deployment/deliveryReportArchive.ts` |
| Discovery output reports | **Complete** | `src/discovery/output-generator.ts`, `product-output-generator.ts`, `detail-output-generator.ts`, `cms-output-generator.ts` |
| Verification reports | **Complete** | `src/discovery/verification/verification-engine.ts` |
| Audit reports | **Complete** | `src/discovery/verification/audit-engine.ts` |
| Repair reports | **Complete** | `src/discovery/verification/repair-engine.ts` |
| Execution timeline | **Partial** | `docs/discovery/execution-timeline.json` exists but generation code not identified as standalone |

### R9. Repair

| Aspect | Status | Evidence |
|---|---|---|
| Audit engine | **Complete** | `src/discovery/verification/audit-engine.ts` |
| Repair engine | **Complete** | `src/discovery/verification/repair-engine.ts` |
| Extraction recovery | **Complete** | `src/discovery/extraction-with-recovery.ts` |

### R10. Build

| Aspect | Status | Evidence |
|---|---|---|
| Production build | **Complete** | `npm run build` (Next.js 16 standalone output) |
| Build verification in workflow | **Complete** | `src/discovery/verification/build-verifier.ts` |

### R11. Test

| Aspect | Status | Evidence |
|---|---|---|
| ESLint check | **Complete** | `npm run lint`, `eslint.config.mjs` |
| TypeScript check | **Complete** | `npm run typecheck`, `tsconfig.json` (strict mode) |
| Combined check | **Complete** | `npm run check` (lint + typecheck + build) |

### R12. Commit

| Aspect | Status | Evidence |
|---|---|---|
| Git commit capability | **Complete** | `deployment/providers/github.ts` pushCode(), git CLI available |

### R13. Return Execution Status

| Aspect | Status | Evidence |
|---|---|---|
| Deployment report | **Complete** | `deploy.ts` returns `DeploymentReport` |
| Delivery report | **Complete** | 19-check verification in `deploy.ts` stepDeliveryComplete |

---

## 2. Partially Complete

### R2. Read Website Factory Policies

| Aspect | Status | Gap |
|---|---|---|
| Policies defined in AGENTS.md | **Partial** | No formal policy registry; policies are embedded in prose |
| Policies defined in SKILL.md | **Partial** | Scope defaults, guiding principles, pre-dispatch checklist exist but not machine-readable |
| website-factory.config.json | **Partial** | Deployment config exists; retry/repair/build policies not formally defined |
| **Missing:** | Centralized policy registry with named policies, versions, and machine-readable format |

### R3. Load Workflow

| Aspect | Status | Gap |
|---|---|---|
| SKILL.md loaded by AI agent | **Partial** | Relies on AI agent reading and interpreting; no programmatic loader |
| deployment.workflow.json loaded | **Complete** | `deployment/workflowRunner.ts` loads and validates |
| **Missing:** | Programmatic workflow loader for SKILL.md that doesn't depend on AI interpretation |

### R6. Retry Failed Tasks

| Aspect | Status | Gap |
|---|---|---|
| Retry utility | **Complete** | `deployment/providers/utils.ts` (exponential backoff) |
| Deployment-level retry | **Complete** | Each deployment step has retry logic |
| **Missing:** | Workflow-level retry policy (retry entire failed phases, not just individual API calls) |
| **Missing:** | Extraction-level retry configuration (how many times to retry extraction engines) |

### R7. Resume Interrupted Tasks

| Aspect | Status | Gap |
|---|---|---|
| Partial state persistence | **Partial** | Discovery outputs saved to docs/discovery/ JSON files |
| Database state | **Partial** | SQLite persists extracted data |
| **Missing:** | Formal checkpoint/resume mechanism (which phase was running, what completed) |
| **Missing:** | Resume entry point that reads state and skips completed phases |

---

## 3. Missing

### R2. Read Website Factory Policies — Policy Registry

| Item | Status |
|---|---|
| Centralized policy file format | **Missing** — No `policies/` directory or machine-readable policy definitions |
| Policy versioning | **Missing** — No version tracking for policy changes |
| Policy validation | **Missing** — No mechanism to verify active policies match expected configuration |

### R5. Call Layer 3 — Orchestration Layer

| Item | Status |
|---|---|
| Layer 3 call interface | **Missing** — No formal interface/contract defining how Layer 2 calls Layer 3 |
| Layer 3 call logging | **Missing** — No structured logging of every Layer 3 invocation with timing |
| Layer 3 call tracing | **Missing** — No request tracing across Layer 2 → Layer 3 calls |

### R6. Retry Failed Tasks — Workflow-Level Retry

| Item | Status |
|---|---|
| Phase-level retry | **Missing** — No mechanism to retry an entire failed phase (e.g., re-run Phase 3 extraction) |
| Retry budget | **Missing** — No maximum retry count per phase or per task type |
| Retry state tracking | **Missing** — No tracking of how many retries have been attempted per task |

### R7. Resume Interrupted Tasks — Checkpoint System

| Item | Status |
|---|---|
| Checkpoint creation | **Missing** — No formal checkpoint saved at phase boundaries |
| Checkpoint reading | **Missing** — No mechanism to read last checkpoint and determine resume point |
| Resume orchestration | **Missing** — No resume logic that skips completed phases |

### R13. Return Execution Status — Structured Status Object

| Item | Status |
|---|---|
| Unified execution status interface | **Missing** — Status is fragmented across multiple report types |
| Real-time status streaming | **Missing** — No mechanism for Layer 1 to receive real-time progress updates |
| Layer 1 callback interface | **Missing** — No formal interface for Layer 1 to receive execution results |

---

## 4. Duplicate Logic

| Duplicate | Location 1 | Location 2 | Description |
|---|---|---|---|
| Deployment verification | `deployment/verify.ts` (pre-deploy) | `deployment/deploy.ts` stepDeliveryComplete (post-deploy) | Overlapping verification checks (Vercel project exists, domain bind, etc.) |
| Database initialization | `scripts/init-db.ts` | `scripts/init-database.mjs` | Two scripts creating overlapping table schemas |
| Asset download | `scripts/download-assets.mjs` | `scripts/download-biopak-assets.mjs` | Two separate download scripts with different target sites but similar patterns |
| Extraction engines | `src/discovery/extraction/jcodesmore-engine.ts` | `src/discovery/detail-extraction-engine.ts` | Overlapping extraction logic between standalone engine and extraction-with-recovery wrapper |
| Quality validation | `src/discovery/quality-validator.ts` | `src/discovery/cms/cms-quality-validator.ts` | Two quality validators with similar structure but different targets |
| Output generation | `src/discovery/output-generator.ts` | `src/discovery/detail-output-generator.ts` | Two output generators producing different report formats |
| Component analysis | `src/analyzer/website-analyzer.ts` | `src/discovery/verification/page-verifier.ts` | Both analyze component existence but from different angles |
| Research importer | `scripts/research-importer.mjs` | (implicit in SKILL.md Phase 2) | Manual import script duplicates what the workflow does automatically |

---

## 5. Dead Code

| File | Description |
|---|---|
| `src/types/solidhydrogen.ts` | Static data for SolidHydrogen site (previous clone target); no longer the active target (BioPak is current). Referenced nowhere in active code. |
| `scripts/run-analyzer.ts` | Script that runs `src/analyzer/website-analyzer.ts`; the analyzer itself is a lightweight component checker that doesn't integrate with the main pipeline. |
| `src/analyzer/` (entire directory) | `website-analyzer.ts`, `config.ts`, `dashboard-schema.ts` — hardcoded to 5 components (Header, Hero, Technology, Team, Footer) from the SolidHydrogen clone. Does not scale to new targets. No integration with discovery or verification systems. |
| `deployment/deploy.ts` legacy steps | `stepVerifyRepository`, `stepConfigureDns`, `stepVerifySsl` — backward compatibility functions still registered in the executor map but not used by current workflow (replaced by `configure_cloudflare_dns`, `verify_dns`, `verify_https`). |
| `src/types/.gitkeep` | Placeholder file; no types directory is empty of custom types beyond the two site-specific files. |
| `src/hooks/.gitkeep` | Placeholder file; no custom hooks have been implemented. |
