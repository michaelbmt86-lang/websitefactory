# Layer 8 — Gap Analysis

## Date
2026-07-18

## Maturity Score

| Metric | Value |
|--------|-------|
| Complete responsibilities | 10/13 |
| Partial responsibilities | 1/13 |
| Missing responsibilities | 2/13 |
| **Maturity score** | **77%** |

## Responsibility Assessment

### Complete (10/13)

| ID | Responsibility | Evidence |
|----|---------------|----------|
| R1 | Build | `npm run build` — Next.js 16 Turbopack, standalone output. `npm run check` = lint + typecheck + build gate. `policies/build-policy.json` defines quality gates. |
| R2 | Package Artifacts | `next.config.ts` standalone mode. `Dockerfile` (3-stage), `Dockerfile.dev`, `docker-compose.yml` for containerized deployment. |
| R3 | Git Repository Management | `deployment/providers/github.ts` — createRepo, pushCode, createWebhook, deleteRepo, repoExists. Full GitHub API client. |
| R4 | GitHub Push | `pushCode()` implements Git Data API: get HEAD → create tree → create commit → update ref. |
| R5 | Vercel Deployment | `deployment/providers/vercel.ts` — createProject, deploy (v13), poll status, bindDomain, setEnvVars, deleteProject. `deploy.ts` orchestrates 12-step pipeline with 30×10s polling. |
| R6 | Environment Variables | Vercel env vars set via API (encrypted, all scopes). `deployment/context.ts` loads from env + config files. Required: GITHUB_TOKEN, VERCEL_TOKEN, CLOUDFLARE_API_TOKEN. |
| R7 | Domain Binding | Both apex + www bound to Vercel. `domain.config.json` stores registrar, DNS provider, deployment provider. |
| R8 | Cloudflare DNS | `deployment/providers/cloudflare.ts` — getZone, addDnsRecord, removeDnsRecord, listDnsRecords, configureSsl. A record (proxied) + CNAME (DNS-only). |
| R9 | HTTPS Verification | Step 8 verifies HTTP 200 on both domains. 19-check #6, #7, #19 validate no 525 SSL errors. SSL via Cloudflare Universal SSL + Vercel managed certs. |
| R10 | Production Verification | 19-check post-deployment validation covering GitHub, Vercel, DNS, HTTPS, homepage, dashboard, login, admin, 404/500/525 errors, Cloudflare zone. |

### Partial (1/13)

| ID | Responsibility | Gap |
|----|---------------|-----|
| R13 | Final Delivery Status | Status reported via exit codes and archived reports. No real-time dashboard, no health monitoring post-deploy, no status page. |

### Missing (2/13)

| ID | Responsibility | Gap | Impact |
|----|---------------|-----|--------|
| R11 | Delivery Reporting | `deliveryReportArchive.ts` generates reports but: no standardized format across layers, no cross-layer delivery status aggregation, no delivery health score, no trend analysis. Reports are archival only — no actionable insights. |
| R12 | Rollback Capability | **No rollback mechanism exists.** `deleteProject()` in Vercel provider is never called. No Vercel rollback commands. No DNS rollback. No domain unbinding. `cleanupOldProject: false`. Failed deployments require manual fix-forward. |

## Gap Details

### R11 — Delivery Reporting (Partial)

**Current state:**
- `deliveryReportArchive.ts` writes `reports/YYYY-MM-DD-{domain}.json`
- Reports contain: git info, Vercel details, Cloudflare details, dashboard credentials, verification summary
- Never overwrites (appends counter)
- Multiple report formats exist across layers (discovery reports, deployment reports, layer validation reports)

**Missing:**
- Standardized delivery report schema across all layers
- Cross-layer delivery status aggregation (which layers succeeded/failed)
- Delivery health score (composite of all layer statuses)
- Trend analysis (deployment success rate over time)
- Actionable recommendations in reports
- Delivery status dashboard (real-time)

### R12 — Rollback Capability (Missing)

**Current state:**
- `deploy.ts` has `deleteProject()` in Vercel provider but never called
- `deployment.workflow.json` sets `deleteOldProject: false`
- `policies/deployment-policy.json` confirms `cleanupOldProject: false`
- `policies/backup-policy.json` covers SQLite backups only, not deployment rollback

**Missing:**
- Vercel project rollback (revert to previous deployment)
- DNS record cleanup (remove orphaned A/CNAME records)
- Domain unbinding (remove domain from Vercel project)
- Rollback trigger (automatic on verification failure)
- Rollback verification (confirm rollback succeeded)
- Rollback reporting (document what was rolled back)

## Duplicate Logic

| Location 1 | Location 2 | Issue |
|-------------|------------|-------|
| `deployment/deployment.workflow.json` | `workflows/deployment-workflow.json` | Duplicate workflow definitions. Two files define the same 12-step deployment pipeline with identical step names. |
| `reports/delivery-report.json` | `docs/discovery/delivery-report.json` | Duplicate delivery reports for same deployment. |
| `run-deploy.ts` | `scripts/deploy-direct.mjs` | Two entry points for deployment. `deploy-direct.mjs` bypasses pre-verification. |

## Dead Code

| File | Issue |
|------|-------|
| `scripts/deploy-direct.mjs` | Bypass script that skips pre-verification. Workaround for `requireSuccess()` bug. Should be removed when bug is fixed. |
| `src/discovery/verification/deployment-verifier.ts` | Uses placeholder values. Not integrated into actual deployment pipeline. |
| `src/discovery/verification/build-verifier.ts` | Hardcoded to "PASS". Not integrated into actual deployment pipeline. |

## Boundary Violations

| Violation | Location | Issue |
|-----------|----------|-------|
| None detected | — | Layer 8 correctly owns only deployment. No extraction, browser, AI, CMS, or SQLite operations in deployment code. |

## Recommended Infrastructure Additions

| Priority | Addition | Responsibility | Description |
|----------|----------|---------------|-------------|
| HIGH | Rollback mechanism | R12 | Implement Vercel rollback (revert to previous deployment), DNS cleanup, domain unbinding. Trigger on verification failure. |
| HIGH | Standardized delivery report | R11 | Unified JSON schema across all layers. Cross-layer status aggregation. Delivery health score. |
| MEDIUM | CI/CD pipeline | R3/R4 | Add `.github/workflows/` for automated deployment on push to master. Currently manual/local-only. |
| MEDIUM | Post-deploy health monitoring | R13 | Periodic health checks after deployment. Status page. Alert on degradation. |
| MEDIUM | Fix `requireSuccess()` bug | R3 | `ProviderResult<void>` causes `connect_github` to fail. Fix type handling. |
| LOW | Remove dead code | — | Remove `deploy-direct.mjs`, fix `deployment-verifier.ts` and `build-verifier.ts` placeholders. |
| LOW | ESLint for deployment/ | — | Remove `deployment/**` from ESLint exclusions. Add deployment code to lint pipeline. |
| LOW | Check numbering fix | R10 | Fix #10 gap in 19-check system (9→11 jump). Renumber to sequential. |

## Maturity Comparison

| Layer | Maturity | Complete | Partial | Missing |
|-------|----------|----------|---------|---------|
| Layer 2 (Execution Engine) | 31% | 4/13 | 7/13 | 2/13 |
| Layer 3 (Extraction Manager) | 31% | 4/13 | 7/13 | 2/13 |
| Layer 4 (Browser Extraction) | 31% | 4/13 | 7/13 | 2/13 |
| Layer 5 (AI Analysis) | 31% | 4/13 | 7/13 | 2/13 |
| Layer 6 (Data Storage) | 31% | 4/13 | 7/13 | 2/13 |
| Layer 7 (CMS Generation) | 69% | 9/13 | 3/13 | 1/13 |
| **Layer 8 (Delivery Pipeline)** | **77%** | **10/13** | **1/13** | **2/13** |

Layer 8 has the highest maturity score of all layers because the delivery pipeline was built as working production code (not just type definitions and policies).
