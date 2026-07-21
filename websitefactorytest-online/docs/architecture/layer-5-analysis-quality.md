# Layer 5 — Analysis Quality

## Overview

Analysis quality defines the scoring model, validation rules, completeness thresholds, and report generation for the Layer 5 AI Analysis Layer. Quality is measured across six dimensions with configurable weights.

---

## Quality Scoring Model

### Weighted Average

| Dimension | Weight | Description |
|---|---|---|
| DOM Completeness | 25% | How complete the DOM extraction is |
| Asset Completeness | 20% | How many images, videos, downloads were found |
| SEO Coverage | 20% | How many pages have meta titles, descriptions, OG tags |
| Schema Coverage | 15% | How many pages have JSON-LD schema markup |
| FAQ Coverage | 10% | How many products have FAQ data |
| Specs Coverage | 10% | How many products have specifications |

### Score Thresholds

| Score | Quality Level | Action |
|---|---|---|
| >= 80% | High Quality | Full output generation |
| >= 60% | Acceptable | Output generation with warnings |
| < 60% | Low Quality | Output generation with issues logged |

---

## Completeness Checks

### Error-Level Issues

| Check | Description |
|---|---|
| `missing-image` | Product has no images |
| `missing-title` | Product has no title |
| `missing-description` | Product has no description |
| `duplicate-product` | Same URL appears multiple times |
| `broken-download` | Download URL is inaccessible |

### Warning-Level Issues

| Check | Description |
|---|---|
| `missing-seo` | Page has no SEO metadata |
| `missing-schema` | Page has no schema markup |
| `missing-specs` | Product has no specifications |
| `missing-faq` | Product has no FAQ data |
| `missing-alt-text` | Image has no alt text |

### Info-Level Issues

| Check | Description |
|---|---|
| `short-description` | Description is shorter than expected |
| `long-title` | Title exceeds recommended length |
| `missing-tags` | Product has no tags |
| `missing-collection` | Product has no collection assignment |

---

## Quality Thresholds

| Category | Threshold | Description |
|---|---|---|
| DOM Completeness | 70% | Minimum DOM extraction completeness |
| Asset Completeness | 60% | Minimum asset extraction completeness |
| SEO Coverage | 80% | Minimum SEO metadata coverage |
| Schema Coverage | 50% | Minimum schema markup coverage |
| FAQ Coverage | 30% | Minimum FAQ data coverage |
| Specs Coverage | 40% | Minimum specifications coverage |
| Overall Quality | 60% | Minimum overall quality score |
| Max Duplicate Rate | 5% | Maximum acceptable duplicate product rate |
| Max Broken Media Rate | 10% | Maximum acceptable broken media rate |

---

## Quality Report Structure

```typescript
interface QualityReport {
  summary: {
    totalProducts: number;
    qualityScore: number;
    issuesCount: number;
    errorsCount: number;
    warningsCount: number;
    infosCount: number;
    completeness: {
      domCompleteness: number;
      assetCompleteness: number;
      seoCoverage: number;
      schemaCoverage: number;
      faqCoverage: number;
      specsCoverage: number;
    };
  };
  issues: QualityIssue[];
  recommendations: string[];
  generatedAt: string;
  durationMs: number;
}

interface QualityIssue {
  productUrl: string;
  productSlug: string;
  issueType: string;
  severity: "error" | "warning" | "info";
  message: string;
}
```

---

## Report Generation

| Report Type | Description |
|---|---|
| Quality Report | Extraction quality, completeness, issues |
| Component Report | Identified reusable components, confidence scores |
| SEO Report | SEO coverage percentages, missing metadata |
| Normalization Report | HTML/CSS/media normalization metrics |
| Final Report | Compiled report with summary and recommendations |
