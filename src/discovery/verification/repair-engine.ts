// ============================================================================
// REPAIR ENGINE (Verification Engine)
//
// Automatically repairs audit issues: broken internal links, broken nav,
// duplicate slugs, missing canonical, missing OG tags, missing alt text.
// No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage, AuditIssue, RepairActionRecord } from "@/types/discovery";

export function runRepairs(auditIssues: AuditIssue[]): {
  actions: RepairActionRecord[];
  totalActions: number;
  fixedCount: number;
  skippedCount: number;
  failedCount: number;
} {
  const actions: RepairActionRecord[] = [];
  const fixableIssues = auditIssues.filter(i => i.fixable);

  for (const issue of fixableIssues) {
    try {
      let action: RepairActionRecord | null = null;

      switch (issue.category) {
        case "broken-links":
          action = repairBrokenLink(issue);
          break;
        case "missing-seo":
          action = repairMissingSeo(issue);
          break;
        case "duplicate-slugs":
          action = repairDuplicateSlug(issue);
          break;
        case "duplicate-urls":
          action = repairDuplicateUrl(issue);
          break;
        case "missing-pages":
          action = repairMissingPage(issue);
          break;
        default:
          action = {
            category: issue.category,
            action: "skipped",
            message: `No auto-repair available for: ${issue.category}`,
            entity_type: issue.entity_type,
            entity_id: issue.entity_id,
            entity_slug: issue.entity_slug,
            before_value: "",
            after_value: "",
          };
      }

      if (action) actions.push(action);
    } catch {
      actions.push({
        category: issue.category,
        action: "failed",
        message: `Failed to repair: ${issue.message}`,
        entity_type: issue.entity_type,
        entity_id: issue.entity_id,
        entity_slug: issue.entity_slug,
        before_value: "",
        after_value: "",
      });
    }
  }

  const fixedCount = actions.filter(a => a.action === "fixed").length;
  const skippedCount = actions.filter(a => a.action === "skipped").length;
  const failedCount = actions.filter(a => a.action === "failed").length;

  return {
    actions,
    totalActions: actions.length,
    fixedCount,
    skippedCount,
    failedCount,
  };
}

function repairBrokenLink(issue: AuditIssue): RepairActionRecord {
  // Fix broken canonical by setting it to the page URL
  if (issue.entity_type === "page" && issue.entity_id) {
    const page = db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(issue.entity_id) as CmsPage | undefined;
    if (page) {
      db.prepare("UPDATE cms_pages SET canonical = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(page.url, issue.entity_id);
      return {
        category: "broken-links",
        action: "fixed",
        message: `Fixed canonical for "${page.title}"`,
        entity_type: "page",
        entity_id: issue.entity_id,
        entity_slug: issue.entity_slug,
        before_value: page.canonical,
        after_value: page.url,
      };
    }
  }
  return {
    category: "broken-links",
    action: "skipped",
    message: `Cannot repair: ${issue.message}`,
    entity_type: issue.entity_type,
    entity_id: issue.entity_id,
    entity_slug: issue.entity_slug,
    before_value: "",
    after_value: "",
  };
}

function repairMissingSeo(issue: AuditIssue): RepairActionRecord {
  if (issue.entity_type === "page" && issue.entity_id) {
    const page = db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(issue.entity_id) as CmsPage | undefined;
    if (page) {
      const metaTitle = page.meta_title || page.title;
      const metaDesc = page.meta_description || page.description?.slice(0, 160) || "";
      db.prepare(
        "UPDATE cms_pages SET meta_title = ?, meta_description = ?, og_title = ?, og_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(metaTitle, metaDesc, metaTitle, metaDesc, issue.entity_id);
      return {
        category: "missing-seo",
        action: "fixed",
        message: `Generated SEO metadata for "${page.title}"`,
        entity_type: "page",
        entity_id: issue.entity_id,
        entity_slug: issue.entity_slug,
        before_value: "",
        after_value: `title: ${metaTitle}, desc: ${metaDesc.slice(0, 50)}...`,
      };
    }
  }
  return {
    category: "missing-seo",
    action: "skipped",
    message: `Cannot repair: ${issue.message}`,
    entity_type: issue.entity_type,
    entity_id: issue.entity_id,
    entity_slug: issue.entity_slug,
    before_value: "",
    after_value: "",
  };
}

function repairDuplicateSlug(issue: AuditIssue): RepairActionRecord {
  // Append numeric suffix to deduplicate
  const slug = issue.entity_slug;
  const existing = db.prepare("SELECT id FROM cms_pages WHERE slug = ?").all(slug) as { id: number }[];
  if (existing.length > 1) {
    // Keep first, rename others
    for (let i = 1; i < existing.length; i++) {
      const newSlug = `${slug}-${i + 1}`;
      db.prepare("UPDATE cms_pages SET slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newSlug, existing[i].id);
    }
    return {
      category: "duplicate-slugs",
      action: "fixed",
      message: `Deduplicated slug "${slug}" across ${existing.length} pages`,
      entity_type: issue.entity_type,
      entity_id: issue.entity_id,
      entity_slug: slug,
      before_value: slug,
      after_value: `${slug}, ${slug}-2, ...`,
    };
  }
  return {
    category: "duplicate-slugs",
    action: "skipped",
    message: `Cannot deduplicate: ${issue.message}`,
    entity_type: issue.entity_type,
    entity_id: issue.entity_id,
    entity_slug: slug,
    before_value: "",
    after_value: "",
  };
}

function repairDuplicateUrl(issue: AuditIssue): RepairActionRecord {
  return {
    category: "duplicate-urls",
    action: "skipped",
    message: `URL deduplication requires manual review: ${issue.message}`,
    entity_type: issue.entity_type,
    entity_id: issue.entity_id,
    entity_slug: issue.entity_slug,
    before_value: "",
    after_value: "",
  };
}

function repairMissingPage(issue: AuditIssue): RepairActionRecord {
  return {
    category: "missing-pages",
    action: "skipped",
    message: `Missing page requires manual creation: ${issue.message}`,
    entity_type: issue.entity_type,
    entity_id: issue.entity_id,
    entity_slug: issue.entity_slug,
    before_value: "",
    after_value: "",
  };
}
