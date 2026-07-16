import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const dbDir = path.join(process.cwd(), "database");
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
      site_name TEXT DEFAULT 'BioPak Australia',
      logo TEXT DEFAULT '/images/logo.png',
      favicon TEXT DEFAULT '/seo/favicon.png',
      meta_title TEXT DEFAULT 'Market Leaders in Sustainable Packaging | BioPak Australia',
      meta_description TEXT DEFAULT 'Award-winning plant-based compostable packaging that puts the planet first.',
      og_image TEXT DEFAULT '/images/hero-bg.jpg',
      phone TEXT DEFAULT '1300 246 725',
      email TEXT DEFAULT 'sales@biopak.com.au',
      address TEXT DEFAULT 'Sydney, Australia',
      facebook_url TEXT DEFAULT 'https://www.facebook.com/biopak/',
      linkedin_url TEXT DEFAULT 'https://www.linkedin.com/company/biopakpackaging/',
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
  `);

  const settingsExists = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (settingsExists.count === 0) {
    db.prepare("INSERT INTO settings (id, site_name) VALUES (1, 'BioPak Australia')").run();
  }

  const categoriesExist = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  if (categoriesExist.count === 0) {
    db.prepare(`INSERT INTO categories (name, slug, description, image_url, display_order) VALUES
      ('Drinks', 'drinks', 'Cups, Lids & Straws', '/images/categories/drinks.png', 1),
      ('Food Packaging', 'food-packaging', 'Containers, Bowls & Plates', '/images/categories/food-packaging.png', 2),
      ('Service & Accessories', 'service-accessories', 'Cutlery, Napkins & Gloves', '/images/categories/service-accessories.jpg', 3),
      ('Bags & Carry', 'bags-carry', 'Paper & Carry Bags', '/images/categories/bags-carry.jpg', 4),
      ('Kits', 'kits', 'Retail & Catering Packs', '/images/categories/kits.png', 5),
      ('Plates & Trays', 'plates-trays', 'Compostable Serveware', '/images/categories/plates-trays.jpg', 6)`);
  }

  const navExists = db.prepare("SELECT COUNT(*) as count FROM navigation").get() as { count: number };
  if (navExists.count === 0) {
    db.prepare(`INSERT INTO navigation (label, href, sort_order) VALUES
      ('SHOP', '/products', 1),
      ('CUSTOM', '/contact', 2),
      ('INDUSTRY', '/industries', 3),
      ('SUSTAINABILITY', '/about', 4),
      ('NEWS', '/blog', 5),
      ('ABOUT US', '/about', 6)`);
  }

  const usersExist = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (usersExist.count === 0) {
    const hash = crypto.createHash("sha256").update("ChangeMe123!").digest("hex");
    db.prepare("INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)").run("admin", hash, "admin@biopak.com.au", "admin");
  }

  const postsExist = db.prepare("SELECT COUNT(*) as count FROM posts").get() as { count: number };
  if (postsExist.count === 0) {
    db.prepare(`INSERT INTO posts (title, slug, excerpt, content, author, category, featured_image) VALUES
      ('The Complete Guide to Composting at Home', 'complete-guide-composting-home', 'Learn how to start composting at home and reduce your environmental impact with simple, practical steps.', '<h2>Why Compost?</h2><p>Composting is one of the simplest and most effective ways to reduce your household waste while creating nutrient-rich soil for your garden.</p><h2>Getting Started</h2><p>Starting a compost bin is easier than you think. You will need a mix of green materials and brown materials.</p>', 'BioPak Team', 'Sustainability', '/images/hero-bg.jpg'),
      ('Why Compostable Packaging Matters for Australian Businesses', 'compostable-packaging-matters-australian-businesses', 'Discover how switching to compostable packaging can benefit your business and the environment.', '<h2>The Business Case for Sustainability</h2><p>Australian consumers are increasingly choosing businesses that demonstrate environmental responsibility.</p>', 'Sarah Mitchell', 'Business', '/images/hero-bg.jpg'),
      ('From Plant to Packaging: The BioPak Story', 'plant-to-packaging-biopak-story', 'Learn about our journey from a small Australian startup to global leaders in sustainable packaging.', '<h2>Our Beginning</h2><p>BioPak was born from a simple idea: packaging should not cost the earth.</p>', 'BioPak Team', 'Company', '/images/hero-bg.jpg')`);
  }
}

try {
  initializeDatabase();
} catch {
  // Database may already be initialized
}

export default db;
