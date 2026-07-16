import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "site.db");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  -- Products table
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

  -- Categories table
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

  -- Navigation table
  CREATE TABLE IF NOT EXISTS navigation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    is_external INTEGER DEFAULT 0,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES navigation(id)
  );

  -- Pages table
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

  -- Settings table
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

  -- Media table
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

  -- Insert default settings
  INSERT OR IGNORE INTO settings (id, site_name) VALUES (1, 'BioPak Australia');

  -- Insert default categories
  INSERT OR IGNORE INTO categories (name, slug, description, image_url, display_order) VALUES
    ('Drinks', 'drinks', 'Cups, Lids & Straws', '/images/categories/drinks.png', 1),
    ('Food Packaging', 'food-packaging', 'Containers, Bowls & Plates', '/images/categories/food-packaging.png', 2),
    ('Service & Accessories', 'service-accessories', 'Cutlery, Napkins & Gloves', '/images/categories/service-accessories.jpg', 3),
    ('Bags & Carry', 'bags-carry', 'Paper & Carry Bags', '/images/categories/bags-carry.jpg', 4),
    ('Kits', 'kits', 'Retail & Catering Packs', '/images/categories/kits.png', 5),
    ('Plates & Trays', 'plates-trays', 'Compostable Serveware', '/images/categories/plates-trays.jpg', 6);

  -- Insert default navigation items
  INSERT OR IGNORE INTO navigation (label, href, sort_order) VALUES
    ('SHOP', '#', 1),
    ('CUSTOM', '/custom-packaging', 2),
    ('INDUSTRY', '/industry', 3),
    ('SUSTAINABILITY', '/environmental-responsibility', 4),
    ('NEWS', '/resources', 5),
    ('ABOUT US', '/about', 6);
`);

console.log("Database initialized successfully!");
console.log("Tables created: products, categories, navigation, pages, settings, media");
console.log("Default data inserted.");

db.close();
