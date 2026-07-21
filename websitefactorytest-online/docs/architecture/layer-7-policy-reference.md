# Layer 7 — Policy Reference

## Overview

This document provides a complete reference for all Layer 7 CMS Generation policies. Policies define rules, constraints, and best practices for CMS generation operations.

## Policies

### 1. CMS Generation Policy (`cms-generation-policy.json`)

**Purpose:** Orchestrator behavior, phase sequencing, error handling, and output packaging.

**Key Rules:**
- 8 sequential phases: pages → brands → collections → blog → seo → search-index → output-files → quality-validation
- Partial results allowed on phase failure
- Output files written to `docs/discovery/`
- Error handling: log-and-continue on phase failure, throw-and-abort on write failure

### 2. CMS Page Policy (`cms-page-policy.json`)

**Purpose:** Page type mapping, content sourcing, slug generation, and SEO field population.

**Key Rules:**
- 14 page type mappings from site_urls to CMS types
- Title sourced from site_urls.title || h1
- Product pages generated from extracted_products
- Slug generation: lowercase, replace spaces, replace special chars
- Conflict resolution: INSERT OR REPLACE on url UNIQUE

### 3. CMS SEO Policy (`cms-seo-policy.json`)

**Purpose:** Meta tags, Open Graph tags, canonical URLs, and structured data.

**Key Rules:**
- Meta title max 60 chars, meta description max 160 chars
- OG tags fallback to page title/description
- Canonical URL uses page URL
- Schema JSON carried from extraction phase
- Minimum SEO coverage: 80%

### 4. CMS Navigation Policy (`cms-navigation-policy.json`)

**Purpose:** Navigation and menu generation hierarchy, sorting, external links.

**Key Rules:**
- Main nav: Home, Collections, Brands, Blog, Contact
- Collections sorted by name with product counts
- Brands sorted by name with product counts
- Footer nav: Products section, Company section
- External links allowed, marked as external

### 5. CMS Schema Policy (`cms-schema-policy.json`)

**Purpose:** Schema/structured data generation, JSON-LD, entity types.

**Key Rules:**
- Primary source: extracted_products.schema_json
- Secondary source: site_urls.json_ld
- Supported types: WebPage, Product, Brand, Collection, BlogPosting, Organization, BreadcrumbList
- Schema copied to cms_pages and cms_seo tables
- Max schema size: 10,000 bytes

### 6. CMS Quality Policy (`cms-quality-policy.json`)

**Purpose:** Quality validation checks, severity levels, quality gates.

**Key Rules:**
- 6 validation checks: missing-metadata, missing-seo, empty-description, missing-image, duplicate-slug, broken-link
- Severity levels: error (blocks deployment), warning (blocks quality gate), info
- Quality gate: min 80% SEO coverage, 0 broken links, 0 duplicate slugs
- Reports include issue list and aggregate counts

## Policy Enforcement

Policies are machine-readable JSON files used by:
- Layer 7 (CMS Generation) — for generation decisions
- Layer 3 (Extraction Manager) — for understanding CMS constraints
- Layer 6 (Data Storage) — for understanding CMS table patterns

## Policy Updates

To update a policy:
1. Edit the JSON file in `policies/`
2. Update the version number
3. Update `generatedAt` timestamp
4. Run validation: `npm run check`
