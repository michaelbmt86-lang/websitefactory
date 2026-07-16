import db from "./db";

/* ===========================
   Products
=========================== */

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  sale_price: number | null;
  sku: string;
  image_url: string;
  gallery_images: string;
  category_id: number;
  in_stock: number;
  is_new: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export function getProducts(): Product[] {
  return db.prepare(`
    SELECT * FROM products
    ORDER BY created_at DESC
  `).all() as Product[];
}

export function getProductBySlug(slug: string): Product | undefined {
  return db.prepare(`
    SELECT * FROM products
    WHERE slug = ?
  `).get(slug) as Product | undefined;
}

export function getProductsByCategory(categoryId: number): Product[] {
  return db.prepare(`
    SELECT * FROM products
    WHERE category_id = ?
    ORDER BY name
  `).all(categoryId) as Product[];
}

export function getFeaturedProducts(): Product[] {
  return db.prepare(`
    SELECT * FROM products
    WHERE is_featured = 1
    LIMIT 8
  `).all() as Product[];
}

export function getNewProducts(): Product[] {
  return db.prepare(`
    SELECT * FROM products
    WHERE is_new = 1
    LIMIT 8
  `).all() as Product[];
}

export function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
  const result = db.prepare(`
    INSERT INTO products (name, slug, description, short_description, price, sale_price, sku, image_url, gallery_images, category_id, in_stock, is_new, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.name, product.slug, product.description, product.short_description,
    product.price, product.sale_price, product.sku, product.image_url,
    product.gallery_images, product.category_id, product.in_stock, product.is_new, product.is_featured
  );
  return db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid) as Product;
}

export function updateProduct(id: number, product: Partial<Product>): void {
  const fields = Object.keys(product).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
  const values = fields.map(k => (product as Record<string, unknown>)[k]);
  db.prepare(`
    UPDATE products SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(...values, id);
}

export function deleteProduct(id: number): void {
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}

/* ===========================
   Categories
=========================== */

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: number | null;
  display_order: number;
  is_active: number;
}

export function getCategories(): Category[] {
  return db.prepare(`
    SELECT * FROM categories
    WHERE is_active = 1
    ORDER BY display_order
  `).all() as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return db.prepare(`
    SELECT * FROM categories
    WHERE slug = ?
  `).get(slug) as Category | undefined;
}

export function createCategory(category: Omit<Category, 'id'>): Category {
  const result = db.prepare(`
    INSERT INTO categories (name, slug, description, image_url, parent_id, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    category.name, category.slug, category.description, category.image_url,
    category.parent_id, category.display_order, category.is_active
  );
  return db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid) as Category;
}

export function updateCategory(id: number, category: Partial<Category>): void {
  const fields = Object.keys(category).filter(k => k !== 'id');
  const values = fields.map(k => (category as Record<string, unknown>)[k]);
  db.prepare(`
    UPDATE categories SET ${fields.map(f => `${f} = ?`).join(', ')}
    WHERE id = ?
  `).run(...values, id);
}

export function deleteCategory(id: number): void {
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
}

/* ===========================
   Navigation
=========================== */

export interface NavigationItem {
  id: number;
  label: string;
  href: string;
  is_external: number;
  parent_id: number | null;
  sort_order: number;
}

export function getNavigation(): NavigationItem[] {
  return db.prepare(`
    SELECT * FROM navigation
    ORDER BY sort_order
  `).all() as NavigationItem[];
}

export function createNavigation(item: Omit<NavigationItem, 'id'>): NavigationItem {
  const result = db.prepare(`
    INSERT INTO navigation (label, href, is_external, parent_id, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(item.label, item.href, item.is_external, item.parent_id, item.sort_order);
  return db.prepare("SELECT * FROM navigation WHERE id = ?").get(result.lastInsertRowid) as NavigationItem;
}

export function updateNavigation(id: number, item: Partial<NavigationItem>): void {
  const fields = Object.keys(item).filter(k => k !== 'id');
  const values = fields.map(k => (item as Record<string, unknown>)[k]);
  db.prepare(`
    UPDATE navigation SET ${fields.map(f => `${f} = ?`).join(', ')}
    WHERE id = ?
  `).run(...values, id);
}

export function deleteNavigation(id: number): void {
  db.prepare("DELETE FROM navigation WHERE id = ?").run(id);
}

/* ===========================
   Pages
=========================== */

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export function getPages(): Page[] {
  return db.prepare(`
    SELECT * FROM pages
    WHERE is_published = 1
    ORDER BY title
  `).all() as Page[];
}

export function getPageBySlug(slug: string): Page | undefined {
  return db.prepare(`
    SELECT * FROM pages
    WHERE slug = ?
  `).get(slug) as Page | undefined;
}

export function createPage(page: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Page {
  const result = db.prepare(`
    INSERT INTO pages (title, slug, content, meta_title, meta_description, is_published)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(page.title, page.slug, page.content, page.meta_title, page.meta_description, page.is_published);
  return db.prepare("SELECT * FROM pages WHERE id = ?").get(result.lastInsertRowid) as Page;
}

export function updatePage(id: number, page: Partial<Page>): void {
  const fields = Object.keys(page).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
  const values = fields.map(k => (page as Record<string, unknown>)[k]);
  db.prepare(`
    UPDATE pages SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(...values, id);
}

export function deletePage(id: number): void {
  db.prepare("DELETE FROM pages WHERE id = ?").run(id);
}

/* ===========================
   Settings
=========================== */

export interface SiteSettings {
  id: number;
  site_name: string;
  logo: string;
  favicon: string;
  meta_title: string;
  meta_description: string;
  og_image: string;
  phone: string;
  email: string;
  address: string;
  facebook_url: string;
  linkedin_url: string;
  instagram_url: string;
}

export function getSettings(): SiteSettings {
  const row = db.prepare("SELECT * FROM settings LIMIT 1").get() as SiteSettings | undefined;
  return row ?? {
    id: 1,
    site_name: "BioPak Australia",
    logo: "/images/logo.png",
    favicon: "/seo/favicon.png",
    meta_title: "Market Leaders in Sustainable Packaging | BioPak Australia",
    meta_description: "Award-winning plant-based compostable packaging that puts the planet first.",
    og_image: "/images/hero-bg.jpg",
    phone: "1300 246 725",
    email: "sales@biopak.com.au",
    address: "Sydney, Australia",
    facebook_url: "https://www.facebook.com/biopak/",
    linkedin_url: "https://www.linkedin.com/company/biopakpackaging/",
    instagram_url: ""
  };
}

export function updateSettings(settings: Partial<SiteSettings>): void {
  const fields = Object.keys(settings).filter(k => k !== 'id');
  const values = fields.map(k => (settings as Record<string, unknown>)[k]);
  db.prepare(`
    UPDATE settings SET ${fields.map(f => `${f} = ?`).join(', ')}
    WHERE id = 1
  `).run(...values);
}

/* ===========================
   Media
=========================== */

export interface Media {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  alt_text: string;
  created_at: string;
}

export function getMedia(): Media[] {
  return db.prepare(`
    SELECT * FROM media
    ORDER BY created_at DESC
  `).all() as Media[];
}

export function createMedia(media: Omit<Media, 'id' | 'created_at'>): Media {
  const result = db.prepare(`
    INSERT INTO media (filename, original_name, mime_type, size, url, alt_text)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(media.filename, media.original_name, media.mime_type, media.size, media.url, media.alt_text);
  return db.prepare("SELECT * FROM media WHERE id = ?").get(result.lastInsertRowid) as Media;
}

export function deleteMedia(id: number): void {
  db.prepare("DELETE FROM media WHERE id = ?").run(id);
}
