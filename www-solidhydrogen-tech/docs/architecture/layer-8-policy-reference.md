# Layer 8 — Policy Reference

## Overview

Layer 8 policies define the rules governing the delivery pipeline: build gates, deployment order, provider configuration, DNS/SSL management, domain lifecycle, and rollback procedures.

## Policies

### delivery-policy.json
**Scope:** deployment-pipeline
**Owner:** layer-8-delivery-pipeline

Master policy governing the full deployment lifecycle.

| Rule Category | Key Rules |
|---------------|-----------|
| Pre-deployment | requireBuild, requireTypecheck, requireLint, requireQualityValidation, requireUpstreamVerification |
| Deployment order | github-push → vercel-deploy → cloudflare-dns → production-verify (failFast: true) |
| Artifact integrity | requireStandaloneOutput, requireGitCommit |
| Post-deployment | requireHealthCheck, requireDnsVerification, requireHttpsVerification, requireProductionVerification |
| Rollback | enabled: true, automatic: false, requireApproval: true |

### github-policy.json
**Scope:** github-integration
**Owner:** layer-8-delivery-pipeline

GitHub repository management rules.

| Rule Category | Key Rules |
|---------------|-----------|
| Authentication | Personal access token, envVar: GITHUB_TOKEN, scopes: repo + admin:repo_hook |
| Repository | Public, default branch: master |
| Push | Git Data API method, require commit message, require tree integrity |
| Webhooks | Create on deploy, events: push + pull_request |
| Cleanup | Never delete repo on rollback |

### vercel-policy.json
**Scope:** vercel-deployment
**Owner:** layer-8-delivery-pipeline

Vercel deployment rules.

| Rule Category | Key Rules |
|---------------|-----------|
| Project creation | Always create new, slug-based naming, framework: nextjs |
| Deployment | Target: production, source: git, poll: 30×10s, required: READY + PROMOTED |
| Environment vars | Encrypted, all scopes, 5 required vars |
| Domain binding | Bind apex + www, handle 409 conflicts |
| Cleanup | deleteOldProject: false |

### cloudflare-policy.json
**Scope:** cloudflare-dns-ssl
**Owner:** layer-8-delivery-pipeline

Cloudflare DNS and SSL rules.

| Rule Category | Key Rules |
|---------------|-----------|
| Authentication | API token, envVar: CLOUDFLARE_API_TOKEN, scopes: Zone:DNS:Edit + Zone:Zone:Read |
| DNS records | Apex: A record → 76.76.21.21 (proxied), WWW: CNAME → cname.vercel-dns.com (DNS-only) |
| SSL | Mode: full, Universal SSL: true |
| Zone lookup | Required, fail on missing |

### domain-policy.json
**Scope:** domain-management
**Owner:** layer-8-delivery-pipeline

Domain binding and lifecycle rules.

| Rule Category | Key Rules |
|---------------|-----------|
| Registration | Registrar: Namecheap, automated: false (manual) |
| Binding | Provider: Vercel, bind apex + www, conflict: retrieve-existing |
| DNS | Provider: Cloudflare, records: A + CNAME |
| Verification | DNS propagation, HTTPS check, dual domain |
| Cleanup | Unbind on rollback: false, remove DNS on rollback: false |

### https-policy.json
**Scope:** https-verification
**Owner:** layer-8-delivery-pipeline

HTTPS and SSL/TLS verification rules.

| Rule Category | Key Rules |
|---------------|-----------|
| Certificate management | Provider: Cloudflare Universal SSL, backup: Vercel managed certs, auto-renew: true |
| Verification | Check apex + www, required: HTTP 200, poll: 10×10s |
| Error detection | Check 525 SSL handshake, 526 invalid SSL, 301 redirects |
| Protocols | Min TLS 1.2, HSTS enabled (1-year max-age) |

### rollback-policy.json
**Scope:** rollback-recovery
**Owner:** layer-8-delivery-pipeline

Rollback and recovery rules.

| Rule Category | Key Rules |
|---------------|-----------|
| Trigger | Automatic: false, manual approval required, conditions: verification-failure + health-check-failure + manual-override |
| Vercel rollback | Revert to previous deployment, preserve project |
| DNS cleanup | Remove records: false |
| Domain unbinding | Unbind domain: false |
| Verification | Require post-rollback check, verify HTTPS + homepage |
| Reporting | Generate rollback report, archive report |

## Policy Compliance

All policies are machine-readable JSON with consistent structure:
- `name` — Policy identifier
- `version` — Semantic version (1.0.0)
- `description` — Human-readable description
- `owner` — Owning layer
- `policy.scope` — Policy scope
- `policy.principle` — Guiding principle
- `policy.rules` — Rule categories with specific constraints

## Cross-Layer Policy Dependencies

| Policy | Depends On | Layer |
|--------|-----------|-------|
| delivery-policy | build-policy.json | Layer 1 (JCodesMore) |
| delivery-policy | quality checks from upstream layers | Layer 7 (CMS) |
| rollback-policy | backup-policy.json | Layer 6 (Data Storage) |
