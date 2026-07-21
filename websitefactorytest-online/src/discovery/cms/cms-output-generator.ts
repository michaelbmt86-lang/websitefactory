// ============================================================================
// CMS OUTPUT GENERATOR (CMS Generator Engine)
//
// Generates final CMS JSON output files: website-manifest.json, cms-library.json,
// navigation.json, sitemap.xml, search-index.json. No site-specific logic.
// ============================================================================

import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { toProductUrl } from "@/lib/public-url";
import type {
  CmsPage,
  CmsBrand,
  CmsCollection,
  CmsSearchIndex,
  CmsManifestOutput,
  CmsSearchOutput,
  CmsNavigationOutput,
  CmsSitemapOutput,
} from "@/types/discovery";
import type { ProjectIdentity } from "../../../deployment/types/identity";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getOutputDir(): string {
  return path.join(process.cwd(), "docs", "discovery");
}

function toPublicPath(inputUrl: string): string {
  try {
    const url = new URL(inputUrl);
    return `${url.pathname}${url.search}${url.hash}` || "/";
  } catch {
    return inputUrl.startsWith("/") ? inputUrl : `/${inputUrl}`;
  }
}

export function generateCmsManifest(identity: ProjectIdentity): CmsManifestOutput {
  const pages = db.prepare("SELECT * FROM cms_pages WHERE status = 'published' ORDER BY page_type, title").all() as CmsPage[];
  const brands = db.prepare("SELECT * FROM cms_brands ORDER BY product_count DESC").all() as CmsBrand[];
  const collections = db.prepare("SELECT * FROM cms_collections ORDER BY product_count DESC").all() as CmsCollection[];

  const blogPages = pages.filter(p => p.page_type === "blog-post");
  const categories = db.prepare(
    "SELECT DISTINCT category FROM extracted_products WHERE status = 'completed' AND category != '' ORDER BY category"
  ).all() as { category: string }[];

  const output: CmsManifestOutput = {
    siteUrl: identity.sourceUrl,
    productDomain: identity.productDomain,
    generatedAt: new Date().toISOString(),
    version: "1.0.0",
    pages: pages.map(p => ({
      url: toProductUrl(p.url, identity.productDomain),
      slug: p.slug,
      title: p.title,
      pageType: p.page_type,
      status: p.status,
    })),
    brands: brands.map(b => ({
      name: b.name,
      slug: b.slug,
      productCount: b.product_count,
    })),
    collections: collections.map(c => ({
      name: c.name,
      slug: c.slug,
      productCount: c.product_count,
    })),
    categories: categories.map(c => ({
      name: c.category,
      slug: c.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    })),
    blog: blogPages.map(b => ({
      title: b.title,
      slug: b.slug,
      excerpt: b.description,
    })),
    totalEntities: pages.length + brands.length + collections.length + blogPages.length,
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "website-manifest.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateCmsSearchOutput(identity: ProjectIdentity): CmsSearchOutput {
  const entries = db.prepare("SELECT * FROM cms_search_index ORDER BY entity_type, title").all() as CmsSearchIndex[];

  const output: CmsSearchOutput = {
    siteUrl: identity.sourceUrl,
    productDomain: identity.productDomain,
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries.map(e => ({
      entityType: e.entity_type,
      entityId: e.entity_id,
      title: e.title,
      description: e.description,
      keywords: e.keywords,
      url: toProductUrl(e.url, identity.productDomain),
      imageUrl: e.image_url,
      category: e.category,
    })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "search-index.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateCmsNavigation(identity: ProjectIdentity): CmsNavigationOutput {
  const pages = db.prepare(
    "SELECT * FROM cms_pages WHERE status = 'published' AND page_type NOT IN ('product-detail', 'blog-post') ORDER BY page_type"
  ).all() as CmsPage[];

  const brands = db.prepare("SELECT * FROM cms_brands ORDER BY name").all() as CmsBrand[];
  const collections = db.prepare("SELECT * FROM cms_collections WHERE name != 'All Products' ORDER BY name").all() as CmsCollection[];

  // Build main nav from page types
  const mainNav: CmsNavigationOutput["mainNav"] = [];

  const homepage = pages.find(p => p.page_type === "homepage");
  if (homepage) {
    mainNav.push({ label: "Home", href: toPublicPath(homepage.url) || "/" });
  }

  const aboutPage = pages.find(p => p.page_type === "about");
  if (aboutPage) {
    mainNav.push({ label: "About", href: toPublicPath(aboutPage.url) || "/about" });
  }

  if (collections.length > 0) {
    mainNav.push({
      label: "Collections",
      href: "/collections",
      children: collections.map(c => ({
        label: c.name,
        href: `/collections/${c.slug}`,
      })),
    });
  }

  if (brands.length > 0) {
    mainNav.push({
      label: "Brands",
      href: "/brands",
      children: brands.map(b => ({
        label: b.name,
        href: `/brands/${b.slug}`,
      })),
    });
  }

  const blogListing = pages.find(p => p.page_type === "blog-listing");
  if (blogListing) {
    mainNav.push({ label: "Blog", href: toPublicPath(blogListing.url) || "/blog" });
  }

  const contactPage = pages.find(p => p.page_type === "contact");
  if (contactPage) {
    mainNav.push({ label: "Contact", href: toPublicPath(contactPage.url) || "/contact" });
  }

  // Footer nav
  const footerNav: CmsNavigationOutput["footerNav"] = [
    {
      section: "Products",
      links: collections.slice(0, 6).map(c => ({
        label: c.name,
        href: `/collections/${c.slug}`,
      })),
    },
    {
      section: "Company",
      links: pages
        .filter(p => ["about", "contact", "policy"].includes(p.page_type))
        .map(p => ({
          label: p.title,
          href: toPublicPath(p.url) || "/",
        })),
    },
  ];

  const output: CmsNavigationOutput = {
    siteUrl: identity.sourceUrl,
    productDomain: identity.productDomain,
    generatedAt: new Date().toISOString(),
    mainNav,
    footerNav,
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "navigation.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateCmsSitemap(identity: ProjectIdentity): CmsSitemapOutput {
  const pages = db.prepare(
    "SELECT * FROM cms_pages WHERE status = 'published' ORDER BY page_type, title"
  ).all() as CmsPage[];

  const output: CmsSitemapOutput = {
    siteUrl: identity.sourceUrl,
    productDomain: identity.productDomain,
    generatedAt: new Date().toISOString(),
    totalUrls: pages.length,
    urls: pages.map(p => {
      let priority = 0.5;
      if (p.page_type === "homepage") priority = 1.0;
      else if (p.page_type === "category" || p.page_type === "collection") priority = 0.9;
      else if (p.page_type === "product-detail") priority = 0.8;
      else if (p.page_type === "blog-post") priority = 0.7;
      else if (["about", "contact"].includes(p.page_type)) priority = 0.6;

      return {
        url: toProductUrl(p.url, identity.productDomain),
        lastmod: p.updated_at || p.created_at,
        changefreq: p.page_type === "blog-post" ? "weekly" : "monthly",
        priority,
      };
    }),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "sitemap.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  // Also generate XML sitemap
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const url of output.urls) {
    xmlLines.push("  <url>");
    xmlLines.push(`    <loc>${url.url}</loc>`);
    xmlLines.push(`    <lastmod>${url.lastmod}</lastmod>`);
    xmlLines.push(`    <changefreq>${url.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${url.priority}</priority>`);
    xmlLines.push("  </url>");
  }
  xmlLines.push("</urlset>");

  fs.writeFileSync(
    path.join(outDir, "sitemap.xml"),
    xmlLines.join("\n"),
    "utf-8"
  );

  return output;
}
