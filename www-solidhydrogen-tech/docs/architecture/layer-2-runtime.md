# Layer 2 — Runtime Infrastructure

## Overview

The Layer 2 Runtime Infrastructure provides machine-readable counterparts to the human-readable documentation (SKILL.md, AGENTS.md). It consists of three directories:

- `policies/` — Policy Registry
- `workflows/` — Workflow Registry
- `runtime/` — Execution Status, Checkpoint, Metadata, Version Manifest

All files in these directories are **ADDITIVE** — they supplement existing documentation without replacing or modifying any existing code, workflows, or APIs.

---

## Policy Registry

**Location:** `policies/`

The Policy Registry contains machine-readable policy definitions that govern the execution behaviour of the Website Factory pipeline. Policies are **READ ONLY** — they document existing rules in a structured format.

### Files

| File | Description |
|---|---|
| `execution-policy.json` | Phase ordering, gate conditions, abort criteria, parallel execution rules |
| `retry-policy.json` | Retry behaviour for API calls, extraction engines, build commands, deployment steps, DNS propagation, HTTP verification |
| `build-policy.json` | Build validation requirements, quality gates, TypeScript strict mode, Next.js build config |
| `repair-policy.json` | Auto-repair categories, manual intervention triggers, repair scope limits |
| `deployment-policy.json` | Provider selection, project lifecycle, domain management, 19-check delivery verification |
| `architecture-lock.json` | Layer boundaries, modification rules, data completeness guarantees |

### Policy File Schema

Every policy file follows this structure:

```json
{
  "name": "policy-name",
  "version": "1.0.0",
  "description": "What this policy governs",
  "owner": "layer-2-execution-engine",
  "enabled": true,
  "rules": { ... }
}
```

### Usage

- Policies are referenced by Layer 2 during execution planning
- Policies supplement AGENTS.md and SKILL.md — they do NOT replace them
- Policy versions track changes to rules over time
- The `architecture-lock.json` policy defines what can and cannot be modified during upgrades

---

## Workflow Registry

**Location:** `workflows/`

The Workflow Registry contains machine-readable mirrors of the existing workflow definitions. Each file corresponds to a human-readable source:

| File | Source of Truth |
|---|---|
| `clone-workflow.json` | `.claude/skills/clone-website/SKILL.md` |
| `deployment-workflow.json` | `deployment/deployment.workflow.json` |
| `verification-workflow.json` | `src/discovery/verification/verification-engine.ts` |

### Workflow File Schema

```json
{
  "name": "workflow-name",
  "version": "1.0.0",
  "description": "What this workflow does",
  "sourceOfTruth": "path/to/human-readable/source",
  "owner": "layer-2-execution-engine",
  "enabled": true,
  "workflow": { ... }
}
```

### Clone Workflow (5 Phases)

1. **Reconnaissance** — Screenshots, global extraction, interaction sweep, page topology
2. **Foundation Build** — Fonts, globals.css, TypeScript types, SVG icons, asset download
3. **Component Specification & Dispatch** — Per-section extraction, spec files, builder dispatch, worktree merge
4. **Page Assembly** — Wire components into page.tsx, connect content, page-level behaviors
5. **Visual QA Diff** — Side-by-side comparison, discrepancy fixes, interactive testing

### Deployment Workflow (12 Steps)

1. create_project (Vercel)
2. connect_github (Vercel)
3. configure_env (Vercel)
4. deploy_project (Vercel)
5. bind_domain (Vercel)
6. configure_cloudflare_dns (Cloudflare)
7. verify_dns (System)
8. verify_https (System)
9. verify_homepage (System)
10. verify_dashboard_login (Browser)
11. verify_admin_account (System)
12. delivery_complete (19-check verification)

### Verification Workflow (10 Verifiers)

1. Page Verifier
2. Product Verifier
3. Media Verifier
4. Link Verifier
5. SEO Verifier
6. Schema Verifier
7. Navigation Verifier
8. Build Verifier
9. Deployment Verifier
10. SQLite Verifier

Plus: Audit Engine + Repair Engine

---

## Execution Status

**Location:** `runtime/execution-status.json`

Tracks the real-time state of the current execution run.

### Fields

| Field | Type | Description |
|---|---|---|
| `currentPhase` | string | Active workflow phase (e.g., "reconnaissance", "idle") |
| `runningTask` | string | Currently executing task identifier |
| `completedTasks` | string[] | Tasks that have finished successfully |
| `failedTasks` | string[] | Tasks that have failed |
| `currentTarget` | string | URL currently being processed |
| `currentDomain` | string | Domain of the current target |
| `executionTime` | number | Elapsed time in milliseconds |
| `startTime` | string | ISO 8601 timestamp of execution start |
| `endTime` | string | ISO 8601 timestamp of execution end |
| `overallStatus` | string | "idle", "running", "completed", "failed" |
| `lastUpdated` | string | ISO 8601 timestamp of last update |

### Usage

- Generated automatically by the Execution Engine
- No existing code depends on this file yet
- Provides observability into pipeline progress

---

## Checkpoint Framework

**Location:** `runtime/checkpoint.json`

Stores checkpoint data at phase boundaries for potential future resume capability.

### Fields

| Field | Type | Description |
|---|---|---|
| `currentPhase` | string | Phase where execution was checkpointed |
| `completedPhases` | string[] | Phases that completed before checkpoint |
| `timestamp` | string | ISO 8601 timestamp of checkpoint creation |
| `currentWorkflow` | string | Active workflow identifier |
| `currentTarget` | string | URL being processed |
| `currentDomain` | string | Domain of the target |
| `executionContext` | object | Execution ID, versions, git commit, node version |

### Important

- **Framework only** — resume logic is NOT implemented
- No code automatically loads or restores from this file
- Exists as infrastructure for future implementation

---

## Execution Metadata

**Location:** `runtime/execution-metadata.json`

Captures the environment and configuration context at execution start.

### Fields

| Field | Type | Description |
|---|---|---|
| `executionId` | string | Unique identifier for this execution run |
| `workflowVersion` | string | Version of the workflow registry being used |
| `policyVersion` | string | Version of the policy registry being used |
| `architectureVersion` | string | Version of the architecture specification |
| `gitCommit` | string | Git commit hash at execution time |
| `nodeVersion` | string | Node.js version |
| `sqliteVersion` | string | SQLite version |
| `opencodeVersion` | string | OpenCode version |
| `executionMode` | string | "clone", "rebuild", or "update" |
| `target` | string | Target URL |
| `domain` | string | Target domain |

---

## Version Manifest

**Location:** `runtime/version-manifest.json`

Aggregates version numbers from all subsystems into a single reference file.

### Fields

| Field | Description |
|---|---|
| `workflowVersion` | Version of the workflow registry |
| `policyVersion` | Version of the policy registry |
| `architectureVersion` | Version of the architecture specification |
| `databaseVersion` | Version of the database schema (from package.json) |
| `dashboardVersion` | Version of the dashboard (from package.json) |
| `cmsVersion` | Version of the CMS generator |
| `deploymentVersion` | Version of the deployment workflow |
| `factoryVersion` | Version of the Website Factory (from website-factory.config.json) |
| `packageVersion` | NPM package version (from package.json) |

---

## Relationship to Existing Documentation

| Existing File | Runtime Counterpart | Relationship |
|---|---|---|
| `.claude/skills/clone-website/SKILL.md` | `workflows/clone-workflow.json` | Human-readable vs machine-readable |
| `deployment/deployment.workflow.json` | `workflows/deployment-workflow.json` | Original vs registry mirror |
| `AGENTS.md` | `policies/*.json` | Prose rules vs structured policies |
| `website-factory.config.json` | `policies/deployment-policy.json` | Config vs policy rules |
| `docs/architecture/layer-2-execution-engine.md` | `policies/architecture-lock.json` | Specification vs enforcement rules |

---

## Rules

1. **Supplement only** — These files supplement existing documentation, they do NOT replace it
2. **READ ONLY** — Existing code does not read these files yet; they are infrastructure for future use
3. **ADDITIVE** — Only new files are created; no existing files are modified
4. **Version tracked** — Each file includes a version number for change tracking
