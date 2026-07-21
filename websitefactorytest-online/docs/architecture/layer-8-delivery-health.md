# Layer 8 — Delivery Health

## Overview

Layer 8 delivery health monitoring tracks the operational status of deployed production websites. Health is assessed across 5 categories: infrastructure, network, content, authentication, and SEO.

## Health States

| State | Score Range | Description |
|-------|-------------|-------------|
| Healthy | ≥ 90 | All deployment checks passing |
| Degraded | 70–89 | Some checks failing but site accessible |
| Unhealthy | < 70 | Critical checks failing |
| Unknown | — | Health not yet assessed |

## Health Score Calculation

```
healthScore = Σ(categoryScore × categoryWeight)

Categories:
  infrastructure: 0.25 (github-repo, vercel-project)
  network:        0.25 (dns-resolution, https-apex, https-www)
  content:        0.25 (homepage-status, dashboard-access, error-pages, ssl-errors)
  authentication: 0.15 (login-form, admin-account, admin-login)
  seo:            0.10 (robots-txt, sitemap-xml)
```

## Health Checks (14)

| Check | Category | Weight | Critical |
|-------|----------|--------|----------|
| github-repo | infrastructure | 0.5 | Yes |
| vercel-project | infrastructure | 0.5 | Yes |
| dns-resolution | network | 0.4 | Yes |
| https-apex | network | 0.3 | Yes |
| https-www | network | 0.3 | Yes |
| homepage-status | content | 0.3 | Yes |
| dashboard-access | content | 0.2 | No |
| error-pages | content | 0.2 | No |
| ssl-errors | content | 0.3 | Yes |
| login-form | authentication | 0.4 | No |
| admin-account | authentication | 0.3 | No |
| admin-login | authentication | 0.3 | No |
| robots-txt | seo | 0.5 | No |
| sitemap-xml | seo | 0.5 | No |

## Critical Check Behavior

If any **critical** check fails, the health state is immediately set to **unhealthy** regardless of the overall score. Critical checks are:

- github-repo
- vercel-project
- dns-resolution
- https-apex
- https-www
- homepage-status
- ssl-errors

## Health Monitoring Flow

1. **Pre-deployment:** Verify infrastructure tokens and provider access
2. **During deployment:** Track phase transitions and step completion
3. **Post-deployment:** Run 19-check verification suite
4. **Ongoing:** Periodic health checks (configurable interval)
5. **On failure:** Trigger health state transition, optionally trigger rollback

## Runtime Module

See `src/deployment/runtime/delivery-health.ts` for type definitions and constants.
