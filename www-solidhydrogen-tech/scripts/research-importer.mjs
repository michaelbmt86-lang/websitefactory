// ============================================================================
// RESEARCH IMPORTER (Phase 4.5 — PoC Fallback Only)
//
// Imports research data from docs/research/ into CMS tables when the
// automated extraction pipeline produces insufficient CMS content.
//
// Constraints:
// - Only executes when cms_pages count < threshold after CMS generator
// - Uses INSERT OR IGNORE (never overwrites existing records)
// - Idempotent: safe to run multiple times
// - Scoped to target domain only
// - Generates import-report.json
// ============================================================================

import Database from "better-sqlite3";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const DB_PATH = join(PROJECT_ROOT, "database", "site.db");
const TARGET_URL = "https://www.solidhydrogen.tech";
const RESEARCH_DIR = join(PROJECT_ROOT, "docs", "research", "www.solidhydrogen.tech");
const REPORT_DIR = join(PROJECT_ROOT, "docs", "discovery");
const REPORT_PATH = join(REPORT_DIR, "import-report.json");
const CMS_PAGE_THRESHOLD = 5;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadResearchData() {
  const textContent = JSON.parse(
    readFileSync(join(RESEARCH_DIR, "text-content.json"), "utf-8")
  );
  return { textContent };
}

function normalizeSections(textContent) {
  const sections = [];
  const nav = ["Technology", "Team", "Benefits", "Products", "Use Cases", "Blog", "Contact Us"];
  const navSlugs = nav.map((n) => slugify(n.replace(/\s+/g, "-").toLowerCase()));

  // Extract unique text by heading level
  const h1s = [];
  const h2s = [];
  const h4s = [];
  const h5s = [];
  const h6s = [];
  const paragraphs = [];

  for (const node of textContent) {
    if (node.tag === "H1") h1s.push(node.text);
    else if (node.tag === "H2") h2s.push(node.text);
    else if (node.tag === "H4") h4s.push(node.text);
    else if (node.tag === "H5") h5s.push(node.text);
    else if (node.tag === "H6") h6s.push(node.text);
    else if (node.tag === "P") paragraphs.push(node.text);
  }

  // Technology section
  const techH5 = h5s.find((t) => t.includes("HYDRIDES"));
  const techH6 = h6s.find((t) => t.includes("SOLIDHYDROGEN specialises"));
  if (techH5) {
    sections.push({
      slug: "technology",
      title: "Technology",
      description: techH6 || "",
      metaTitle: "Technology — SolidHydrogen",
      metaDescription: (techH6 || "").slice(0, 160),
      pageType: "page",
      entityType: "page",
    });
  }

  // Team section
  const teamH1 = h1s.find((t) => t.includes("Executive Team"));
  const teamH5 = h5s.find((t) => t.includes("BEST OF CLASS"));
  if (teamH1 || h2s.length > 0) {
    const teamMembers = [];
    for (const name of h2s) {
      const cleaned = name.replace(/\n/g, " ");
      if (cleaned.includes("Francois") || cleaned.includes("Philippe")) {
        teamMembers.push(cleaned);
      }
    }
    sections.push({
      slug: "team",
      title: "Team",
      description: teamH5
        ? `${teamH5.replace(/\n/g, " ")}. ${teamMembers.join(", ")}`
        : "Our Executive Team",
      metaTitle: "Team — SolidHydrogen",
      metaDescription: "Meet the executive team behind SolidHydrogen's revolutionary hydrogen storage technology.",
      pageType: "page",
      entityType: "page",
    });
  }

  // Benefits section
  const benefitsH5 = h5s.find((t) => t.includes("OUR ADVANTAGE"));
  const benefitsH6 = h6s.filter(
    (t) =>
      t.includes("Low cost") ||
      t.includes("Pure H2") ||
      t.includes("Long Life") ||
      t.includes("recyclable") ||
      t.includes("energy density") ||
      t.includes("Quick cycles") ||
      t.includes("flexibility")
  );
  if (benefitsH5) {
    sections.push({
      slug: "benefits",
      title: "Benefits",
      description: benefitsH6.join(". ").replace(/\n/g, " "),
      metaTitle: "Benefits — SolidHydrogen",
      metaDescription: "SOLIDHYDROGEN hydrides offer low cost, safety, long life, and unparalleled flexibility in hydrogen storage.",
      pageType: "page",
      entityType: "page",
    });
  }

  // Contact section
  const contactH4 = h4s.find((t) => t.includes("SOLIDHYDROGEN is a startup"));
  if (contactH4) {
    sections.push({
      slug: "contact",
      title: "Contact Us",
      description: contactH4.replace(/\n/g, " "),
      metaTitle: "Contact — SolidHydrogen",
      metaDescription: "Get in touch with SolidHydrogen. Sydney Knowledge Hub, The University of Sydney.",
      pageType: "contact",
      entityType: "page",
    });
  }

  // Use Cases section (nav item, limited content)
  sections.push({
    slug: "use-cases",
    title: "Use Cases",
    description: "SolidHydrogen hydrides enable hydrogen storage, compression, and filtration across multiple industries.",
    metaTitle: "Use Cases — SolidHydrogen",
    metaDescription: "Explore hydrogen use cases powered by SolidHydrogen's ambient-temperature hydride technology.",
    pageType: "page",
    entityType: "page",
  });

  // About section (from footer info)
  const aboutDesc = paragraphs.find((p) => p.includes("SYDNEY KNOWLEDGE HUB")) || "";
  sections.push({
    slug: "about",
    title: "About SolidHydrogen",
    description: aboutDesc
      ? `SOLIDHYDROGEN is a startup based in Australia and the US. ${aboutDesc}`
      : "SOLIDHYDROGEN specialises in ambient-temperature hydrides for hydrogen storage.",
    metaTitle: "About — SolidHydrogen",
    metaDescription: "SOLIDHYDROGEN is a startup based in Australia and the US, specialising in hydrides for hydrogen storage.",
    pageType: "about",
    entityType: "page",
  });

  return sections;
}

function importToDatabase(sections) {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const startTime = Date.now();
  const report = {
    targetUrl: TARGET_URL,
    timestamp: new Date().toISOString(),
    durationMs: 0,
    source: {
      textContent: "docs/research/www.solidhydrogen.tech/text-content.json",
      globalExtraction: "docs/research/www.solidhydrogen.tech/global-extraction.json",
      pageTopology: "docs/research/www.solidhydrogen.tech/PAGE_TOPOLOGY.md",
    },
    imported: { pages: 0, seo: 0, searchIndex: 0, media: 0 },
    skipped: { pages: 0, seo: 0, searchIndex: 0 },
    duplicates: { pages: 0, seo: 0 },
    errors: [],
  };

  // Check existing pages count
  const existingCount = db.prepare("SELECT COUNT(*) as count FROM cms_pages").get().count;
  console.log(`[research-importer] Existing CMS pages: ${existingCount}`);

  if (existingCount >= CMS_PAGE_THRESHOLD) {
    console.log(`[research-importer] Sufficient CMS content (${existingCount} >= ${CMS_PAGE_THRESHOLD}). Running in supplementary mode — adding missing sections only.`);
  }

  // Get existing page slugs for dedup
  const existingSlugs = new Set(
    db.prepare("SELECT slug FROM cms_pages").all().map((r) => r.slug)
  );
  console.log(`[research-importer] Existing slugs: ${[...existingSlugs].join(", ")}`);

  const insertPage = db.prepare(`
    INSERT OR IGNORE INTO cms_pages (url, slug, title, description, page_type, source_table,
      meta_title, meta_description, og_title, og_description, canonical, schema_json, status)
    VALUES (?, ?, ?, ?, ?, 'research-import', ?, ?, ?, ?, ?, '[]', 'published')
  `);

  const insertSeo = db.prepare(`
    INSERT OR IGNORE INTO cms_seo (url, slug, page_type, entity_type,
      meta_title, meta_description, og_title, og_description, canonical, schema_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')
  `);

  const insertSearch = db.prepare(`
    INSERT INTO cms_search_index (entity_type, entity_id, title, description, keywords, url, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const importTransaction = db.transaction(() => {
    for (const section of sections) {
      const url = `${TARGET_URL}/${section.slug}`;
      const isDuplicate = existingSlugs.has(section.slug);

      if (isDuplicate) {
        report.duplicates.pages++;
        report.skipped.pages++;
        console.log(`[research-importer] SKIP (duplicate): ${section.slug}`);
        continue;
      }

      try {
        // Insert CMS page
        const pageResult = insertPage.run(
          url,
          section.slug,
          section.title,
          section.description,
          section.pageType,
          section.metaTitle,
          section.metaDescription,
          section.title,
          section.metaDescription,
          url
        );

        if (pageResult.changes > 0) {
          report.imported.pages++;
          const pageId = pageResult.lastInsertRowid;

          // Insert SEO entry
          const seoResult = insertSeo.run(
            url,
            section.slug,
            section.pageType,
            section.entityType,
            section.metaTitle,
            section.metaDescription,
            section.title,
            section.metaDescription,
            url
          );
          if (seoResult.changes > 0) report.imported.seo++;
          else report.skipped.seo++;

          // Insert search index entry
          const keywords = [section.pageType, section.title, section.description]
            .filter(Boolean)
            .join(" ");
          insertSearch.run(
            section.entityType,
            pageId,
            section.title,
            section.description,
            keywords,
            url,
            section.pageType
          );
          report.imported.searchIndex++;

          console.log(`[research-importer] IMPORTED: ${section.slug} (${section.title})`);
        } else {
          report.skipped.pages++;
          console.log(`[research-importer] SKIP (no change): ${section.slug}`);
        }
      } catch (err) {
        report.errors.push({ slug: section.slug, error: err.message });
        console.error(`[research-importer] ERROR: ${section.slug}:`, err.message);
      }
    }
  });

  importTransaction();

  report.durationMs = Date.now() - startTime;

  // Write report
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`[research-importer] Import complete in ${report.durationMs}ms`);
  console.log(`[research-importer] Imported: ${report.imported.pages} pages, ${report.imported.seo} SEO, ${report.imported.searchIndex} search`);
  console.log(`[research-importer] Skipped: ${report.skipped.pages} pages (duplicates: ${report.duplicates.pages})`);
  console.log(`[research-importer] Errors: ${report.errors.length}`);
  console.log(`[research-importer] Report: ${REPORT_PATH}`);

  db.close();
  return report;
}

// Main
console.log("[research-importer] Starting Research Importer for", TARGET_URL);
console.log("[research-importer] Phase 4.5 — PoC Fallback Mode");

const { textContent } = loadResearchData();
console.log(`[research-importer] Loaded ${textContent.length} text nodes from research data`);

const sections = normalizeSections(textContent);
console.log(`[research-importer] Normalized ${sections.length} sections from research data`);

const report = importToDatabase(sections);

if (report.errors.length > 0) {
  console.error("[research-importer] ERRORS occurred during import:");
  for (const err of report.errors) {
    console.error(`  - ${err.slug}: ${err.error}`);
  }
  process.exit(1);
}

console.log("[research-importer] DONE");
