# Layer 8 — Delivery Pipeline

## Overview

Layer 8 owns the entire deployment pipeline: building verified artifacts, pushing to GitHub, deploying to Vercel, configuring Cloudflare DNS/SSL, binding domains, and verifying production availability. It is the final layer — the output of all upstream layers flows through Layer 8 to reach the live internet.

## Architecture Boundary

### Layer 8 Owns

- Build Compilation (Next.js production build)
- Package Artifacts (standalone output, static files)
- Git Repository Management (push to GitHub)
- GitHub Push (commit, branch, push)
- Vercel Deployment (project creation, deployment trigger, polling)
- Environment Variables (Vercel encrypted env)
- Domain Binding (apex + www on Vercel)
- Cloudflare DNS (A record, CNAME, proxy settings)
- HTTPS Verification (TLS certificate validation)
- Production Verification (19-check post-deploy validation)
- Delivery Reporting (archived deployment reports)
- Rollback Capability (Vercel rollback, DNS cleanup) [MISSING]
- Final Delivery Status (overall deployment health)

### Layer 8 MUST NOT Own

- Website Extraction (Layer 3, Layer 4)
- Browser Automation (Layer 4)
- Chrome DevTools MCP (Layer 4)
- JCodesMore Recovery (Layer 4)
- Firecrawl Recovery (Layer 4)
- AI Analysis / Gemini (Layer 5)
- SQLite Runtime (Layer 6)
- CMS Content Generation (Layer 7)
- CMS Output Packaging (Layer 7)
- Dashboard Runtime (Next.js pages)

## Responsibilities

| ID | Responsibility | Status | Description |
|----|---------------|--------|-------------|
| R1 | Build | Complete | `npm run build` compiles Next.js 16 production build (Turbopack, standalone output). Quality gate: `npm run check` = lint + typecheck + build. |
| R2 | Package Artifacts | Complete | `next.config.ts` outputs standalone mode. Docker support: 3-stage Dockerfile (dependencies → builder → runner). `docker-compose.yml` for local/prod. |
| R3 | Git Repository Management | Complete | GitHub API client (`deployment/providers/github.ts`): createRepo, pushCode (Git Data API), createWebhook, deleteRepo, repoExists. Known bug: `requireSuccess()` fails on `ProviderResult<void>`. |
| R4 | GitHub Push | Complete | `pushCode()` implements full Git Data API flow: get HEAD → create tree → create commit → update ref. Uses GitHub token from env. |
| R5 | Vercel Deployment | Complete | Full Vercel API client (`deployment/providers/vercel.ts`): createProject, deploy (v13 API), poll status (30×10s), bindDomain, setEnvironmentVariables, deleteProject. `deploy.ts` orchestrates 12-step pipeline. |
| R6 | Environment Variables | Complete | Vercel env vars set via API: NODE_ENV, DOMAIN, GITHUB_REPO, ADMIN_EMAIL, ADMIN_PASSWORD. All encrypted, all scopes. Source: `deployment/context.ts` reads from env + config files. |
| R7 | Domain Binding | Complete | Both apex (`websitefactorytest.online`) and `www` subdomain bound to Vercel project. `domain.config.json` stores registrar (Namecheap), DNS provider (Cloudflare), deployment provider (Vercel). |
| R8 | Cloudflare DNS | Complete | API client (`deployment/providers/cloudflare.ts`): getZone, addDnsRecord, removeDnsRecord, listDnsRecords, configureSsl. Config: A record (76.76.21.21, proxied) + CNAME (cname.vercel-dns.com, DNS-only). SSL mode: full. |
| R9 | HTTPS Verification | Complete | Step 8: fetch `https://{domain}` + `https://www.{domain}`, verify HTTP 200. 19-check #6, #7, #19 validate no 525 SSL errors. SSL managed by Cloudflare Universal SSL + Vercel managed certs. |
| R10 | Production Verification | Complete | 19-check post-deployment validation in `stepDeliveryComplete`: GitHub repo, Vercel project, deployment READY + PROMOTED, domain bound, HTTPS apex/www, DNS configured, homepage >5KB, dashboard accessible, login works, admin account, no 404/500/525 errors, Cloudflare zone. |
| R11 | Delivery Reporting | Complete | `deployment/deliveryReportArchive.ts`: generates JSON reports to `reports/YYYY-MM-DD-{domain}.json`. Captures git info, Vercel details, Cloudflare details, dashboard credentials, verification summary, repair history. Never overwrites (appends counter). |
| R12 | Rollback Capability | Missing | No Vercel rollback commands. No DNS rollback. No domain unbinding. `deleteProject()` exists in Vercel provider but never called. `cleanupOldProject: false` in workflow config. |
| R13 | Final Delivery Status | Partial | Status reported via exit codes (0=success, 1=failure) and archived delivery reports. No real-time status dashboard. No health monitoring post-deploy. |

## Deployment Order (Architecture Locked)

```
GitHub Push
    ↓
Vercel Deployment
    ↓
Cloudflare DNS + SSL
    ↓
Production Website
```

This order is enforced by `deployment/deployment.workflow.json` and `deploy.ts`. Steps execute sequentially with `fail_fast: true`.

## Inputs

| Source | Layer | Data |
|--------|-------|------|
| Build artifacts | Layer 1–7 (all) | Complete Next.js application with all features |
| Quality reports | Layer 2–7 | Verification that all layers passed validation |
| CMS output | Layer 7 | Pages, brands, collections, blog, SEO, search index, navigation, sitemap |
| SQLite database | Layer 6 | Production database with all extracted/generated data |

## Outputs

| Output | Destination | Description |
|--------|-------------|-------------|
| Live website | Vercel + Cloudflare | Production website accessible via custom domain |
| Delivery report | `reports/YYYY-MM-DD-{domain}.json` | Archived deployment record |
| Git repository | GitHub | Pushed source code |
| DNS records | Cloudflare | A record + CNAME for domain resolution |
| SSL certificates | Cloudflare + Vercel | TLS termination for HTTPS |

## Implementation Files

| File | Lines | Purpose |
|------|-------|---------|
| `deployment/deploy.ts` | 1,207 | Main 12-step deployment orchestrator |
| `deployment/verify.ts` | ~200 | 10-check pre-deployment verification |
| `deployment/context.ts` | ~80 | Centralized context loader (tokens, config) |
| `deployment/workflowRunner.ts` | ~300 | Workflow execution engine |
| `deployment/deliveryReportArchive.ts` | ~200 | Report generation and archival |
| `deployment/providers/vercel.ts` | ~400 | Vercel API client (7 methods) |
| `deployment/providers/github.ts` | ~300 | GitHub API client (5 methods) |
| `deployment/providers/cloudflare.ts` | ~250 | Cloudflare API client (5 methods) |
| `deployment/providers/types.ts` | ~100 | Provider interfaces |
| `deployment/providers/utils.ts` | ~200 | Retry logic, slug utils, validation |
| `deployment/providers/logger.ts` | ~100 | Structured logging |
| `deployment/deployment.workflow.json` | ~200 | 12-step workflow definition |
| `deployment/vercel.config.json` | ~10 | Vercel provider config |
| `deployment/cloudflare.config.json` | ~10 | Cloudflare provider config |
| `deployment/domain.config.json` | ~15 | Domain registry config |
| `run-deploy.ts` | ~50 | Entry point: verify → deploy |
| `scripts/deploy-direct.mjs` | ~50 | Bypass script (skip pre-verification) |
| `Dockerfile` | ~40 | Production Docker image (3-stage) |
| `Dockerfile.dev` | ~20 | Development Docker image |
| `docker-compose.yml` | ~40 | Multi-service orchestration |
| `package.json` | ~50 | Build scripts, dependencies, engines |

## Provider Configuration

### Vercel
- Template project: `websitefactorytest`
- Framework: Next.js
- Auto-deploy: enabled
- Output: standalone (Docker-ready)

### GitHub
- Repository: `michaelbmt86-lang/websitefactory`
- Branch: `master`
- Push method: Git Data API (not CLI)

### Cloudflare
- DNS management: enabled
- SSL: full mode
- Proxy: apex (proxied), www (DNS-only)

### Domain
- Registrar: Namecheap (external, not automated)
- Primary: `websitefactorytest.online`
- Environment: test

## Known Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | `requireSuccess()` bug with `ProviderResult<void>` | Medium | `connect_github` step fails; workaround via `deploy-direct.mjs` |
| 2 | Check #10 missing (numbering gap 9→11) | Low | Documentation/code mismatch |
| 3 | `deployment/` excluded from ESLint | Low | No lint enforcement on deployment code |
| 4 | Hardcoded admin email in `context.ts` | Low | Not configurable per-environment |
| 5 | No domain/DNS cleanup between deployments | Medium | Orphaned resources accumulate |
