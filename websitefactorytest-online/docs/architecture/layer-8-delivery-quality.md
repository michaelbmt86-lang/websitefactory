# Layer 8 — Delivery Quality

## Overview

Layer 8 delivery quality ensures deployed production websites meet reliability, performance, and correctness standards. Quality is enforced through pre-deployment gates, post-deployment verification, and ongoing health monitoring.

## Quality Gates

### Pre-Deployment Gates (10 checks)
Run before any deployment action. All must pass.

| # | Check | Description |
|---|-------|-------------|
| 1 | context_tokens | GITHUB_TOKEN, VERCEL_TOKEN, CLOUDFLARE_API_TOKEN present |
| 2 | context_domain | targetDomain, deploymentProvider, dnsProvider configured |
| 3 | config_files | 4 config files exist (domain, vercel, cloudflare, workflow) |
| 4 | workspace_root | src/ and package.json exist |
| 5 | github_repo_exists | Repository accessible via API |
| 6 | cloudflare_zone_lookup | Zone found for domain |
| 7 | cloudflare_ssl_status | SSL records verifiable |
| 8 | vercel_project_check | Project exists on Vercel |
| 9 | vercel_domain_bind | Domain bound to project |
| 10 | cloudflare_dns_verified | DNS records in Cloudflare |

### Build Quality Gates
| Gate | Command | Required |
|------|---------|----------|
| TypeScript | `npm run typecheck` | Yes |
| Lint | `npm run lint` | Yes |
| Build | `npm run build` | Yes |
| Combined | `npm run check` | Yes (quick validation) |

### Post-Deployment Verification (19 checks)
Run after deployment completes. Results archived in delivery report.

| # | Check | Category | Critical |
|---|-------|----------|----------|
| 1 | github_repo_exists | infrastructure | Yes |
| 2 | vercel_project_exists | infrastructure | Yes |
| 3 | deployment_ready | infrastructure | Yes |
| 4 | production_deployment | infrastructure | Yes |
| 5 | custom_domain_bound | infrastructure | Yes |
| 6 | https_apex_200 | network | Yes |
| 7 | https_www_200 | network | Yes |
| 8 | dns_configured | network | Yes |
| 9 | homepage_status_and_size | content | Yes |
| 11 | dashboard_200 | content | No |
| 12 | dashboard_login_works | content | No |
| 13 | admin_account_exists | authentication | No |
| 14 | admin_login_succeeds | authentication | No |
| 15 | admin_dashboard_loads | authentication | No |
| 16 | no_not_found_errors | content | Yes |
| 17 | no_404_pages | content | Yes |
| 18 | no_500_errors | content | Yes |
| 19 | no_525_ssl_errors | network | Yes |
| 20 | cloudflare_dns_verified | network | Yes |

**Note:** Check #10 is missing from the implementation (numbering gap 9→11). Total is 20 checks.

## Quality Scoring

Health score is computed from check results:

```
healthScore = (passedCritical / totalCritical) × 70 + (passedNonCritical / totalNonCritical) × 30
```

| Score | Quality Level |
|-------|---------------|
| ≥ 90 | Excellent |
| 70–89 | Good |
| 50–69 | Degraded |
| < 50 | Poor |

## Quality Reports

Each deployment generates a quality report archived to:
- `reports/YYYY-MM-DD-{domain}.json`

Reports contain:
- All check results (pass/fail/warn)
- Health score
- Timing metrics
- Git commit info
- Provider details

## Runtime Module

See `src/deployment/runtime/delivery-health.ts` for health scoring implementation.
