# Layer 3 — Extraction Quality Standards

**Date:** 2026-07-18
**Scope:** Quality thresholds and validation rules for the Layer 3 Extraction Manager

---

## Quality Dimensions

### DOM Completeness

| Attribute | Detail |
|---|---|
| **Dimension** | DOM Completeness |
| **Description** | Percentage of DOM elements successfully extracted |
| **Fields** | title, description, short_description, specifications, faq |
| **Weight** | 0.25 (25% of overall score) |
| **Minimum Threshold** | 70% |
| **Enforcement** | Advisory (flag low quality, do not block storage) |

### Asset Completeness

| Attribute | Detail |
|---|---|
| **Dimension** | Asset Completeness |
| **Description** | Percentage of assets (images, videos, downloads) successfully extracted |
| **Fields** | images, videos, downloads |
| **Weight** | 0.20 (20% of overall score) |
| **Minimum Threshold** | 60% |
| **Enforcement** | Advisory (flag low quality, do not block storage) |

### Image Coverage

| Attribute | Detail |
|---|---|
| **Dimension** | Image Coverage |
| **Description** | Percentage of product images successfully extracted |
| **Fields** | images_json, gallery_json |
| **Weight** | 0.20 (20% of overall score) |
| **Minimum Threshold** | 50% |
| **Enforcement** | Advisory (flag low quality, do not block storage) |

### SEO Completeness

| Attribute | Detail |
|---|---|
| **Dimension** | SEO Completeness |
| **Description** | Percentage of SEO fields successfully extracted |
| **Fields** | seo_json (title, meta description, keywords) |
| **Weight** | 0.20 (20% of overall score) |
| **Minimum Threshold** | 80% |
| **Enforcement** | Advisory (flag low quality, do not block storage) |

### Schema Completeness

| Attribute | Detail |
|---|---|
| **Dimension** | Schema Completeness |
| **Description** | Percentage of schema.org structured data successfully extracted |
| **Fields** | schema_json |
| **Weight** | 0.15 (15% of overall score) |
| **Minimum Threshold** | 50% |
| **Enforcement** | Advisory (flag low quality, do not block storage) |

---

## Overall Extraction Score

| Attribute | Detail |
|---|---|
| **Score Type** | Weighted average of all quality dimensions |
| **Calculation** | (DOM × 0.25) + (Asset × 0.20) + (Image × 0.20) + (SEO × 0.20) + (Schema × 0.15) |
| **Minimum Threshold** | 65 |
| **Scale** | 0-100 |
| **Enforcement** | Advisory (flag low quality, do not block storage) |

---

## Quality Validation Rules

### Validation Process

1. **Assess DOM Completeness** — Calculate percentage of DOM elements successfully extracted
2. **Assess Asset Completeness** — Calculate percentage of assets successfully extracted
3. **Assess Image Coverage** — Calculate percentage of product images successfully extracted
4. **Assess SEO Completeness** — Calculate percentage of SEO fields successfully extracted
5. **Assess Schema Completeness** — Calculate percentage of schema.org data successfully extracted
6. **Calculate Overall Score** — Apply weights and calculate weighted average
7. **Generate Quality Report** — Create structured report with scores, issues, recommendations

### Enforcement Rules

| Rule | Value | Notes |
|---|---|---|
| **Block Storage** | false | Low-quality extractions are NOT blocked from storage |
| **Log Issues** | true | Quality issues are logged for monitoring |
| **Include in Report** | true | Quality scores are included in extraction reports |
| **Flag Low Quality** | true | Products below thresholds are flagged for review |

### Quality Thresholds Summary

| Dimension | Minimum Threshold | Weight | Enforcement |
|---|---|---|---|
| DOM Completeness | 70% | 0.25 | Advisory |
| Asset Completeness | 60% | 0.20 | Advisory |
| Image Coverage | 50% | 0.20 | Advisory |
| SEO Completeness | 80% | 0.20 | Advisory |
| Schema Completeness | 50% | 0.15 | Advisory |
| **Overall Score** | **65** | **1.00** | **Advisory** |

---

## Quality Report Format

```json
{
  "productId": "number",
  "url": "string",
  "overallScore": "number (0-100)",
  "dimensions": {
    "domCompleteness": { "score": "number", "threshold": 70, "passed": "boolean" },
    "assetCompleteness": { "score": "number", "threshold": 60, "passed": "boolean" },
    "imageCoverage": { "score": "number", "threshold": 50, "passed": "boolean" },
    "seoCompleteness": { "score": "number", "threshold": 80, "passed": "boolean" },
    "schemaCompleteness": { "score": "number", "threshold": 50, "passed": "boolean" }
  },
  "issues": ["string"],
  "recommendations": ["string"],
  "timestamp": "ISO 8601"
}
```
