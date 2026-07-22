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

  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT DEFAULT '',
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  -- Posts table
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

  -- Logs table
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Insert default settings (CMS will populate via admin dashboard)
  INSERT OR IGNORE INTO settings (id, site_name) VALUES (1, 'Website Factory');

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
    ('SHOP', '/products', 1),
    ('CUSTOM', '/contact', 2),
    ('INDUSTRY', '/industries', 3),
    ('SUSTAINABILITY', '/about', 4),
    ('NEWS', '/blog', 5),
    ('ABOUT US', '/about', 6);

  -- Insert admin user (password synced from ADMIN_PASSWORD env var on cold start)
  INSERT OR IGNORE INTO users (username, password_hash, email, role) VALUES
    ('admin', '${crypto.createHash("sha256").update("ChangeMe123!").digest("hex")}', 'admin@websitefactory.local', 'admin');

  -- Insert sample blog posts
  INSERT OR IGNORE INTO posts (title, slug, excerpt, content, author, category, featured_image) VALUES
    ('Getting Started with Our Products', 'getting-started', 'A comprehensive guide to help you choose the right products for your business needs.', '<h2>Introduction</h2><p>We offer a wide range of products designed to meet the needs of various industries. This guide will help you get started.</p><h2>Browse Our Catalog</h2><p>Explore our categories to find the perfect solution for your business.</p>', 'Team', 'Company', '/images/hero-bg.jpg'),
    ('How to Choose the Right Products for Your Business', 'choosing-right-products', 'Find out which products best suit your industry and customer requirements.', '<h2>Consider Your Industry</h2><p>Different industries have different needs. Consider what matters most for your customers and operations.</p>', 'Team', 'Industry', '/images/hero-bg.jpg'),
    ('Our Commitment to Quality', 'commitment-to-quality', 'Learn about our dedication to quality and customer satisfaction across every product we offer.', '<h2>Quality First</h2><p>We believe in delivering products that meet the highest standards of quality and reliability.</p>', 'Team', 'Company', '/images/hero-bg.jpg');
`);

console.log("Database initialized successfully!");
console.log("Tables created: products, categories, navigation, pages, settings, media, users, posts, logs");
console.log("Default data inserted: settings, categories, navigation, admin user, sample posts");

db.close();
