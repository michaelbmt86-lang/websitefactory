# Layer 5 — AI Analysis Layer Policy Reference

## Overview

Layer 5 policies define the rules, constraints, and behaviours for the AI Analysis Layer. These policies are enforced at runtime and ensure consistent, quality analysis output.

---

## Policies

### 1. AI Analysis Policy (`ai-analysis-policy.json`)

**Purpose:** Defines overall analysis behaviour — modes, input handling, output generation, quality thresholds.

| Rule | Setting | Value |
|---|---|---|
| **Analysis Modes** | Available modes | heuristic, gemini-api, hybrid |
| | Default mode | heuristic |
| | Gemini is analysis-only | true |
| | Gemini never crawls | true |
| | Gemini never replaces browser | true |
| **Input Handling** | Require clean handoff | true |
| | Require HTML normalization | true |
| | Require media normalization | true |
| | Require CSS normalization | true |
| | Max input HTML size | 10 MB |
| | Min input content length | 100 chars |
| **Output Generation** | Generate structured JSON | true |
| | Generate CMS content | true |
| | Generate SEO metadata | true |
| | Generate analysis report | true |
| | Generate component inventory | true |
| | Output format | json |
| **Quality Thresholds** | Min DOM completeness | 70% |
| | Min asset completeness | 60% |
| | Min SEO coverage | 80% |
| | Min schema coverage | 50% |
| | Min FAQ coverage | 30% |
| | Min specs coverage | 40% |
| | Max duplicate rate | 5% |

---

### 2. Gemini Policy (`gemini-policy.json`)

**Purpose:** Defines Gemini analysis constraints — analysis-only, never crawls, never replaces other engines.

| Rule | Setting | Value |
|---|---|---|
| **Gemini Role** | Role | analysis-only |
| | Never crawls | true |
| | Never acquires webpages | true |
| | Never manages browser sessions | true |
| | Never stores data | true |
| | Never deploys | true |
| | Never renders UI | true |
| | Receives pre-extracted data | true |
| **Gemini Boundary** | Never replaces Chrome DevTools MCP | true |
| | Never replaces JCodesMore | true |
| | Never replaces Firecrawl | true |
| | Never becomes primary engine | true |
| | Priority order | chrome-devtools-mcp → jcodesmore → firecrawl → gemini-analysis |
| **Gemini Input** | Accepts HTML | true |
| | Accepts structured data | true |
| | Accepts network data | true |
| | Max HTML size | 10 MB |
| **Gemini Output** | Produces title, subtitle, description | true |
| | Produces brand, model, SKU | true |
| | Produces category, subcategory | true |
| | Produces specifications, FAQ | true |
| | Produces related products, tags | true |
| | Produces collection, breadcrumbs | true |
| **Gemini Fallback** | Fallback to heuristic | true |
| | Fallback to original data | true |
| | Log failure | true |
| | Report to Layer 3 | true |

---

### 3. Normalization Policy (`normalization-policy.json`)

**Purpose:** Defines normalization rules — HTML, CSS, media, structured data, and output normalization.

| Rule | Setting | Value |
|---|---|---|
| **HTML Normalization** | Strip scripts | true |
| | Strip styles | true |
| | Strip comments | true |
| | Decode entities | true |
| | Normalize whitespace | true |
| | Lowercase attributes | true |
| | Preserve data attributes | true |
| | Preserve ARIA attributes | true |
| **CSS Normalization** | Extract inline styles | true |
| | Extract external stylesheets | true |
| | Extract design tokens | true |
| | Extract color palette | true |
| | Extract typography | true |
| | Extract spacing | true |
| **Media Normalization** | Deduplicate by hash | true |
| | Deduplicate by URL | true |
| | Categorize by type | true |
| | Normalize URLs | true |
| | Validate URLs | true |
| | Extract metadata | true |
| | Max file size | 50 MB |
| **Output Normalization** | Normalize URLs | true |
| | Normalize slugs | true |
| | Normalize titles | true |
| | Trim whitespace | true |
| | Max title length | 200 chars |
| | Max description length | 5000 chars |

---

### 4. SEO Analysis Policy (`seo-analysis-policy.json`)

**Purpose:** Defines SEO metadata generation, analysis, coverage requirements, and fallback rules.

| Rule | Setting | Value |
|---|---|---|
| **SEO Generation** | Generate meta title | true |
| | Generate meta description | true |
| | Generate OG tags | true |
| | Generate canonical | true |
| | Generate schema JSON | true |
| | Fallback from page title | true |
| | Fallback from page description | true |
| | Max meta title length | 60 chars |
| | Max meta description length | 160 chars |
| **SEO Analysis** | Analyze meta tags | true |
| | Analyze Open Graph | true |
| | Analyze schema markup | true |
| | Analyze breadcrumbs | true |
| | Analyze headings | true |
| | Analyze alt text | true |
| | Analyze internal links | true |
| | Analyze canonical | true |
| **SEO Coverage** | Min meta title coverage | 95% |
| | Min meta description coverage | 90% |
| | Min OG tag coverage | 80% |
| | Min schema coverage | 50% |
| | Min breadcrumbs coverage | 70% |
| | Min alt text coverage | 80% |

---

### 5. CMS Analysis Policy (`cms-analysis-policy.json`)

**Purpose:** Defines CMS generation rules — page, brand, collection, blog generation, and quality validation.

| Rule | Setting | Value |
|---|---|---|
| **Page Generation** | Generate from site URLs | true |
| | Generate from products | true |
| | Generate from categories | true |
| | Assign page types | true |
| | Assign SEO metadata | true |
| | Deduplicate by slug | true |
| **Brand Generation** | Extract from products | true |
| | Deduplicate by brand name | true |
| | Generate brand pages | true |
| | Generate brand SEO | true |
| **Collection Generation** | Extract from categories | true |
| | Deduplicate by slug | true |
| | Generate collection pages | true |
| | Assign products to collections | true |
| **Blog Generation** | Generate from discovered content | true |
| | Deduplicate by post slug | true |
| | Generate post SEO | true |
| | Assign categories and tags | true |
| **Search Index** | Index all pages | true |
| | Index all products | true |
| | Index all brands | true |
| | Index all collections | true |
| | Index all blog posts | true |
| **Quality Validation** | Validate all pages have title | true |
| | Validate all pages have description | true |
| | Validate all pages have SEO | true |
| | Min CMS quality score | 80% |

---

### 6. Analysis Quality Policy (`analysis-quality-policy.json`)

**Purpose:** Defines quality scoring, validation rules, completeness thresholds, and report generation.

| Rule | Setting | Value |
|---|---|---|
| **Quality Scoring** | Scoring model | weighted-average |
| | DOM completeness weight | 25% |
| | Asset completeness weight | 20% |
| | SEO coverage weight | 20% |
| | Schema coverage weight | 15% |
| | FAQ coverage weight | 10% |
| | Specs coverage weight | 10% |
| | Min passing score | 60% |
| **Completeness Checks** | Check missing images | true |
| | Check missing SEO | true |
| | Check missing schema | true |
| | Check missing specs | true |
| | Check broken downloads | true |
| | Check broken media | true |
| | Check duplicate products | true |
| | Check duplicate images | true |
| | Check empty titles | true |
| | Check empty descriptions | true |
| **Issue Severity** | Error severity | missing-image, missing-title, missing-description, duplicate-product, broken-download |
| | Warning severity | missing-seo, missing-schema, missing-specs, missing-faq, missing-alt-text |
| | Info severity | short-description, long-title, missing-tags, missing-collection |
| **Quality Thresholds** | DOM completeness threshold | 70% |
| | Asset completeness threshold | 60% |
| | SEO coverage threshold | 80% |
| | Schema coverage threshold | 50% |
| | Overall quality threshold | 60% |
| | Max duplicate rate | 5% |
| | Max broken media rate | 10% |
