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

  -- Insert admin user (password: ChangeMe123!)
  INSERT OR IGNORE INTO users (username, password_hash, email, role) VALUES
    ('admin', '${crypto.createHash("sha256").update("ChangeMe123!").digest("hex")}', 'admin@biopak.com.au', 'admin');

  -- Insert sample blog posts
  INSERT OR IGNORE INTO posts (title, slug, excerpt, content, author, category, featured_image) VALUES
    ('The Complete Guide to Composting at Home', 'complete-guide-composting-home', 'Learn how to start composting at home and reduce your environmental impact with simple, practical steps.', '<h2>Why Compost?</h2><p>Composting is one of the simplest and most effective ways to reduce your household waste while creating nutrient-rich soil for your garden. At BioPak, we believe that every small action counts toward a more sustainable future.</p><h2>Getting Started</h2><p>Starting a compost bin is easier than you think. You will need a mix of green materials (food scraps, grass clippings) and brown materials (dry leaves, cardboard). The key is maintaining the right balance.</p><h2>What Can You Compost?</h2><p>With BioPak compostable packaging, you can now add your takeaway containers and cups directly to your compost bin. Our products are certified commercially compostable and will break down within 12 weeks in industrial composting facilities.</p><h2>Benefits for Your Garden</h2><p>Finished compost improves soil structure, increases moisture retention, and provides essential nutrients for healthy plant growth. It is nature''s perfect fertiliser.</p>', 'BioPak Team', 'Sustainability', '/images/blog/composting-guide.jpg'),
    ('Why Compostable Packaging Matters for Australian Businesses', 'compostable-packaging-matters-australian-businesses', 'Discover how switching to compostable packaging can benefit your business and the environment.', '<h2>The Business Case for Sustainability</h2><p>Australian consumers are increasingly choosing businesses that demonstrate environmental responsibility. By switching to compostable packaging, your business sends a clear message that you care about the planet.</p><h2>Reducing Landfill Waste</h2><p>Every year, millions of tonnes of packaging end up in Australian landfills. Traditional plastic packaging can take hundreds of years to decompose, releasing harmful greenhouse gases in the process. Compostable alternatives break down naturally within months.</p><h2>Customer Expectations</h2><p>Studies show that 78% of Australian consumers prefer to buy from environmentally responsible businesses. Compostable packaging is not just good for the planet—it is good for business.</p><h2>Making the Switch</h2><p>BioPak offers a comprehensive range of compostable packaging solutions for every industry, from cafes and restaurants to retail and events. Our team can help you find the perfect products for your needs.</p>', 'Sarah Mitchell', 'Business', '/images/blog/business-composting.jpg'),
    ('From Plant to Packaging: The BioPak Story', 'plant-to-packaging-biopak-story', 'Learn about our journey from a small Australian startup to global leaders in sustainable packaging.', '<h2>Our Beginning</h2><p>BioPak was born from a simple idea: packaging should not cost the earth. Founded in Australia, we set out to create packaging alternatives that are kind to the environment without compromising on quality or performance.</p><h2>Innovation in Sustainability</h2><p>Our packaging is made from renewable resources like sugarcane, wood fibre, and corn starch. These materials are by-products of existing industries, meaning we are not using additional agricultural land or resources.</p><h2>Certified Compostable</h2><p>Every BioPak product is certified to Australian Standards for compostability. When disposed of in commercial composting facilities, our packaging breaks down completely, leaving no harmful residues behind.</p><h2>Looking Ahead</h2><p>We continue to innovate and push the boundaries of what is possible with sustainable packaging. Our goal is simple: to make compostable packaging the new normal.</p>', 'BioPak Team', 'Company', '/images/blog/biopak-story.jpg');
`);

console.log("Database initialized successfully!");
console.log("Tables created: products, categories, navigation, pages, settings, media, users, posts, logs");
console.log("Default data inserted: settings, categories, navigation, admin user, sample posts");

db.close();
