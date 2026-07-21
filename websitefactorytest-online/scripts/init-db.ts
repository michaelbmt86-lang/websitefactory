import Database from "better-sqlite3";
import path from "path";

const db = new Database(
  path.join(process.cwd(), "database", "site.db")
);

// Site Settings
db.exec(`
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY,
  site_name TEXT,
  logo TEXT,
  favicon TEXT,
  primary_color TEXT,
  email TEXT
);
`);

// Theme
db.exec(`
CREATE TABLE IF NOT EXISTS theme (
  id INTEGER PRIMARY KEY,
  site_name TEXT,
  logo TEXT,
  favicon TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  background_color TEXT,
  text_color TEXT,
  button_color TEXT,
  font_family TEXT
);
`);

// Navigation
db.exec(`
CREATE TABLE IF NOT EXISTS navigation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT,
  href TEXT,
  sort_order INTEGER
);
`);

// Hero
db.exec(`
CREATE TABLE IF NOT EXISTS hero (
  id INTEGER PRIMARY KEY,
  title1 TEXT,
  title2 TEXT,
  title3 TEXT,
  video TEXT,
  poster TEXT
);
`);

// Benefits
db.exec(`
CREATE TABLE IF NOT EXISTS benefits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icon TEXT,
  title TEXT
);
`);

// Team
db.exec(`
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  position TEXT,
  bio TEXT,
  image TEXT
);
`);

// Footer
db.exec(`
CREATE TABLE IF NOT EXISTS footer (
  id INTEGER PRIMARY KEY,
  address TEXT,
  copyright TEXT,
  email TEXT
);
`);

// Images
db.exec(`
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  path TEXT,
  alt TEXT
);
`);

// Videos
db.exec(`
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  path TEXT,
  poster TEXT
);
`);
// SEO
db.exec(`
  CREATE TABLE IF NOT EXISTS seo (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    keywords TEXT,
    og_image TEXT,
    canonical TEXT,
    robots TEXT
  );
  `);
console.log("Database created successfully.");