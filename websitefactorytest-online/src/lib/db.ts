// ============================================================================
// DATABASE MODULE (Website Factory Framework)
//
// Patterns:
//   - Vercel-aware path: /tmp on serverless, process.cwd() locally
//   - WAL mode for concurrent reads
//   - Tables created with IF NOT EXISTS (idempotent)
//   - Seed data uses .run() on EVERY prepare() — never omit .run()
//   - Admin user is UPSERTed on every cold start (password synced from env)
//   - Seed data inserted only if table is empty (count check)
//   - Error logging on init failure (never silently swallow)
// ============================================================================

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const isVercel = !!process.env.VERCEL;
const dbDir = isVercel
  ? path.join("/tmp", "database")
  : path.join(process.cwd(), "database");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "site.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      short_description TEXT DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      sale_price REAL,
      sku TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      gallery_images TEXT DEFAULT '[]',
      category_id INTEGER,
      in_stock INTEGER DEFAULT 1,
      is_new INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      parent_id INTEGER,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS navigation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      is_external INTEGER DEFAULT 0,
      parent_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES navigation(id)
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT DEFAULT '',
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      site_name TEXT DEFAULT '',
      logo TEXT DEFAULT '/images/logo.png',
      favicon TEXT DEFAULT '/seo/favicon.png',
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      og_image TEXT DEFAULT '/images/hero-bg.jpg',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      facebook_url TEXT DEFAULT '',
      linkedin_url TEXT DEFAULT '',
      instagram_url TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      alt_text TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT DEFAULT '',
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      author TEXT DEFAULT '',
      category TEXT DEFAULT '',
      featured_image TEXT DEFAULT '',
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      slug TEXT NOT NULL,
      depth INTEGER NOT NULL DEFAULT 0,
      parent_url TEXT,
      page_type TEXT NOT NULL DEFAULT 'Unknown',
      status TEXT NOT NULL DEFAULT 'discovered',
      priority INTEGER NOT NULL DEFAULT 50,
      discovered_by TEXT NOT NULL DEFAULT 'manual',
      title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      canonical_url TEXT,
      h1 TEXT DEFAULT '',
      internal_links INTEGER DEFAULT 0,
      external_links INTEGER DEFAULT 0,
      images INTEGER DEFAULT 0,
      json_ld TEXT,
      status_code INTEGER,
      response_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(url)
    );

    CREATE INDEX IF NOT EXISTS idx_site_urls_slug ON site_urls(slug);
    CREATE INDEX IF NOT EXISTS idx_site_urls_page_type ON site_urls(page_type);
    CREATE INDEX IF NOT EXISTS idx_site_urls_status ON site_urls(status);
    CREATE INDEX IF NOT EXISTS idx_site_urls_depth ON site_urls(depth);
    CREATE INDEX IF NOT EXISTS idx_site_urls_parent_url ON site_urls(parent_url);

    CREATE TABLE IF NOT EXISTS product_urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Unknown',
      product_slug TEXT NOT NULL,
      product_name TEXT DEFAULT '',
      source_page TEXT NOT NULL DEFAULT '',
      discovered_by TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'discovered',
      priority INTEGER NOT NULL DEFAULT 50,
      canonical_url TEXT,
      json_ld TEXT,
      price TEXT,
      sku TEXT,
      image_url TEXT,
      in_stock INTEGER DEFAULT 1,
      is_duplicate INTEGER DEFAULT 0,
      duplicate_of TEXT,
      status_code INTEGER,
      response_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(url)
    );

    CREATE INDEX IF NOT EXISTS idx_product_urls_category ON product_urls(category);
    CREATE INDEX IF NOT EXISTS idx_product_urls_status ON product_urls(status);
    CREATE INDEX IF NOT EXISTS idx_product_urls_product_slug ON product_urls(product_slug);
    CREATE INDEX IF NOT EXISTS idx_product_urls_source_page ON product_urls(source_page);
    CREATE INDEX IF NOT EXISTS idx_product_urls_is_duplicate ON product_urls(is_duplicate);

    CREATE TABLE IF NOT EXISTS extracted_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      description TEXT DEFAULT '',
      short_description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      subcategory TEXT DEFAULT '',
      brand TEXT DEFAULT '',
      model TEXT DEFAULT '',
      sku TEXT DEFAULT '',
      language TEXT DEFAULT 'en',
      images_json TEXT DEFAULT '[]',
      gallery_json TEXT DEFAULT '[]',
      downloads_json TEXT DEFAULT '[]',
      specifications_json TEXT DEFAULT '[]',
      seo_json TEXT DEFAULT '{}',
      schema_json TEXT DEFAULT '[]',
      related_products_json TEXT DEFAULT '[]',
      faq_json TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT DEFAULT '',
      retry_count INTEGER DEFAULT 0,
      extraction_time_ms INTEGER DEFAULT 0,
      extraction_engine TEXT DEFAULT 'chrome-devtools-mcp',
      last_attempt TEXT DEFAULT '',
      failure_reason TEXT DEFAULT '',
      recovery_status TEXT DEFAULT 'primary',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(url)
    );

    CREATE INDEX IF NOT EXISTS idx_extracted_products_slug ON extracted_products(slug);
    CREATE INDEX IF NOT EXISTS idx_extracted_products_status ON extracted_products(status);
    CREATE INDEX IF NOT EXISTS idx_extracted_products_category ON extracted_products(category);

    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'image',
      url TEXT NOT NULL,
      alt TEXT DEFAULT '',
      width INTEGER,
      height INTEGER,
      hash TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES extracted_products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_media_assets_product_id ON media_assets(product_id);
    CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);

    CREATE TABLE IF NOT EXISTS cms_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      page_type TEXT NOT NULL DEFAULT 'page',
      source_table TEXT DEFAULT '',
      source_id INTEGER,
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      og_title TEXT DEFAULT '',
      og_description TEXT DEFAULT '',
      og_image TEXT DEFAULT '',
      canonical TEXT DEFAULT '',
      schema_json TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(url)
    );

    CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
    CREATE INDEX IF NOT EXISTS idx_cms_pages_page_type ON cms_pages(page_type);
    CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON cms_pages(status);

    CREATE TABLE IF NOT EXISTS cms_brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      product_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cms_brands_slug ON cms_brands(slug);

    CREATE TABLE IF NOT EXISTS cms_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      product_count INTEGER DEFAULT 0,
      products_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cms_collections_slug ON cms_collections(slug);

    CREATE TABLE IF NOT EXISTS cms_seo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      slug TEXT NOT NULL,
      page_type TEXT DEFAULT '',
      entity_type TEXT NOT NULL DEFAULT 'page',
      entity_id INTEGER,
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      og_title TEXT DEFAULT '',
      og_description TEXT DEFAULT '',
      og_image TEXT DEFAULT '',
      canonical TEXT DEFAULT '',
      schema_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(url)
    );

    CREATE INDEX IF NOT EXISTS idx_cms_seo_slug ON cms_seo(slug);
    CREATE INDEX IF NOT EXISTS idx_cms_seo_entity_type ON cms_seo(entity_type);

    CREATE TABLE IF NOT EXISTS cms_search_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL DEFAULT 'page',
      entity_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      keywords TEXT DEFAULT '',
      url TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      category TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cms_search_entity_type ON cms_search_index(entity_type);
    CREATE INDEX IF NOT EXISTS idx_cms_search_title ON cms_search_index(title);

    CREATE TABLE IF NOT EXISTS verification_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_url TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      total_checks INTEGER DEFAULT 0,
      passed_checks INTEGER DEFAULT 0,
      warning_checks INTEGER DEFAULT 0,
      failed_checks INTEGER DEFAULT 0,
      skipped_checks INTEGER DEFAULT 0,
      overall_status TEXT NOT NULL DEFAULT 'SKIPPED',
      pages_json TEXT DEFAULT '{}',
      products_json TEXT DEFAULT '{}',
      media_json TEXT DEFAULT '{}',
      links_json TEXT DEFAULT '{}',
      seo_json TEXT DEFAULT '{}',
      schema_json TEXT DEFAULT '{}',
      navigation_json TEXT DEFAULT '{}',
      build_json TEXT DEFAULT '{}',
      deployment_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_url TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      total_issues INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      warning_count INTEGER DEFAULT 0,
      info_count INTEGER DEFAULT 0,
      fixable_count INTEGER DEFAULT 0,
      overall_status TEXT NOT NULL DEFAULT 'SKIPPED',
      issues_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repair_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_url TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      total_actions INTEGER DEFAULT 0,
      fixed_count INTEGER DEFAULT 0,
      skipped_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      overall_status TEXT NOT NULL DEFAULT 'SKIPPED',
      actions_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deployment_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_url TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      git_status TEXT DEFAULT '',
      commit_count INTEGER DEFAULT 0,
      last_commit TEXT DEFAULT '',
      build_output TEXT DEFAULT '',
      build_success INTEGER DEFAULT 0,
      vercel_status TEXT DEFAULT '',
      cloudflare_status TEXT DEFAULT '',
      env_vars_count INTEGER DEFAULT 0,
      overall_status TEXT NOT NULL DEFAULT 'SKIPPED',
      details_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extraction_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      primary_engine TEXT NOT NULL DEFAULT 'chrome-devtools-mcp',
      successful_engine TEXT,
      attempts INTEGER DEFAULT 1,
      duration_ms INTEGER DEFAULT 0,
      failure_reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_extraction_metrics_url ON extraction_metrics(url);
    CREATE INDEX IF NOT EXISTS idx_extraction_metrics_status ON extraction_metrics(status);
    CREATE INDEX IF NOT EXISTS idx_extraction_metrics_successful_engine ON extraction_metrics(successful_engine);

    CREATE TABLE IF NOT EXISTS deployments (
      domain TEXT PRIMARY KEY,
      github_repo TEXT DEFAULT '',
      github_folder TEXT DEFAULT '',
      vercel_project_id TEXT DEFAULT '',
      vercel_project_name TEXT DEFAULT '',
      cloudflare_zone_id TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ALTER TABLE for existing databases — add recovery columns if missing
  const altCols = [
    "ALTER TABLE extracted_products ADD COLUMN extraction_engine TEXT DEFAULT 'chrome-devtools-mcp'",
    "ALTER TABLE extracted_products ADD COLUMN last_attempt TEXT DEFAULT ''",
    "ALTER TABLE extracted_products ADD COLUMN failure_reason TEXT DEFAULT ''",
    "ALTER TABLE extracted_products ADD COLUMN recovery_status TEXT DEFAULT 'primary'",
  ];
  for (const sql of altCols) {
    try { db.exec(sql); } catch { /* column already exists */ }
  }

  // Seed settings (single row, insert if empty)
  const settingsExists = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (settingsExists.count === 0) {
    db.prepare("INSERT INTO settings (id, site_name) VALUES (1, ?)").run(
      process.env.SITE_NAME || "Website Factory"
    );
  }

  // Seed categories (multi-row — MUST call .run())
  const categoriesExist = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (categoriesExist.count === 0) {
    db.prepare(`INSERT INTO categories (name, slug, description, image_url, display_order) VALUES
      ('Category One', 'category-one', 'Description for the first category', '/images/categories/category-one.png', 1),
      ('Category Two', 'category-two', 'Description for the second category', '/images/categories/category-two.png', 2),
      ('Category Three', 'category-three', 'Description for the third category', '/images/categories/category-three.png', 3),
      ('Category Four', 'category-four', 'Description for the fourth category', '/images/categories/category-four.png', 4),
      ('Category Five', 'category-five', 'Description for the fifth category', '/images/categories/category-five.png', 5),
      ('Category Six', 'category-six', 'Description for the sixth category', '/images/categories/category-six.png', 6)`).run();
  }

  // Seed navigation (multi-row — MUST call .run())
  const navExists = db.prepare("SELECT COUNT(*) as count FROM navigation").get() as { count: number };
  if (navExists.count === 0) {
    db.prepare(`INSERT INTO navigation (label, href, sort_order) VALUES
      ('Products', '/products', 1),
      ('Industries', '/industries', 2),
      ('About', '/about', 3),
      ('Blog', '/blog', 4),
      ('Contact', '/contact', 5)`).run();
  }

  // Admin UPSERT — always syncs password from env var on cold start.
  // This ensures password changes via env are reflected without manual DB updates.
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const hash = crypto.createHash("sha256").update(adminPassword).digest("hex");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  const existingAdmin = db.prepare("SELECT id FROM users WHERE username = ?").get(adminUsername) as { id: number } | undefined;
  if (existingAdmin) {
    db.prepare("UPDATE users SET password_hash = ?, email = ?, role = ? WHERE username = ?").run(hash, adminEmail, "admin", adminUsername);
  } else {
    db.prepare("INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)").run(adminUsername, hash, adminEmail, "admin");
  }

  // Seed posts (multi-row — MUST call .run())
  const postsExist = db.prepare("SELECT COUNT(*) as count FROM posts").get() as { count: number };
  if (postsExist.count === 0) {
    db.prepare(`INSERT INTO posts (title, slug, excerpt, content, author, category, featured_image) VALUES
      ('Getting Started with Our Products', 'getting-started', 'A comprehensive guide to help you choose the right products for your business needs.', '<h2>Introduction</h2><p>We offer a wide range of products designed to meet the needs of various industries. This guide will help you get started.</p><h2>Browse Our Catalog</h2><p>Explore our categories to find the perfect solution for your business.</p>', 'Team', 'Company', '/images/hero-bg.jpg'),
      ('How to Choose the Right Products for Your Business', 'choosing-right-products', 'Find out which products best suit your industry and customer requirements.', '<h2>Consider Your Industry</h2><p>Different industries have different needs. Consider what matters most for your customers and operations.</p>', 'Team', 'Industry', '/images/hero-bg.jpg'),
      ('Our Commitment to Quality', 'commitment-to-quality', 'Learn about our dedication to quality and customer satisfaction across every product we offer.', '<h2>Quality First</h2><p>We believe in delivering products that meet the highest standards of quality and reliability.</p>', 'Team', 'Company', '/images/hero-bg.jpg')`).run();
  }
}

try {
  initializeDatabase();
} catch (err) {
  console.error("[db] Database initialization failed:", err);
}

export default db;
