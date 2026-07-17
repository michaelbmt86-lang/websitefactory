// ============================================================================
// DETAIL OUTPUT GENERATOR
//
// Generates products.json, media-library.json, seo-library.json, and
// schema-library.json from extracted product data.
// Reusable — no site-specific logic.
// ============================================================================

import fs from "fs";
import path from "path";
import db from "@/lib/db";
import type {
  ExtractedProduct,
  ProductsJsonOutput,
  MediaLibraryOutput,
  SEOLibraryOutput,
  SchemaLibraryOutput,
  ProductSEO,
  ProductSchema,
  ProductImage,
  ProductDownload,
  ProductSpecification,
  ProductFAQ,
  ProductRelatedProduct,
} from "@/types/discovery";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getOutputDir(): string {
  return path.join(process.cwd(), "docs", "discovery");
}

function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

export function generateProductsJson(siteUrl: string): ProductsJsonOutput {
  const products = db.prepare(`
    SELECT * FROM extracted_products WHERE status = 'completed' ORDER BY category, title
  `).all() as ExtractedProduct[];

  const output: ProductsJsonOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    products: products.map(p => ({
      url: p.url,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      shortDescription: p.short_description,
      category: p.category,
      subcategory: p.subcategory,
      brand: p.brand,
      model: p.model,
      sku: p.sku,
      language: p.language,
      primaryImage: getPrimaryImage(p.images_json),
      galleryImages: safeJsonParse(p.gallery_json, [] as ProductImage[]),
      downloads: safeJsonParse(p.downloads_json, [] as ProductDownload[]),
      specifications: safeJsonParse(p.specifications_json, [] as ProductSpecification[]),
      seo: safeJsonParse(p.seo_json, {} as ProductSEO),
      schema: safeJsonParse(p.schema_json, [] as ProductSchema[]),
      relatedProducts: safeJsonParse(p.related_products_json, [] as ProductRelatedProduct[]),
      faq: safeJsonParse(p.faq_json, [] as ProductFAQ[]),
      status: p.status,
    })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "products.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateMediaLibraryJson(siteUrl: string): MediaLibraryOutput {
  const assets = db.prepare(`
    SELECT ma.*, ep.slug as product_slug
    FROM media_assets ma
    JOIN extracted_products ep ON ma.product_id = ep.id
    ORDER BY ma.type, ma.url
  `).all() as { id: number; product_id: number; product_slug: string; type: string; url: string; alt: string; width: number | null; height: number | null; hash: string; created_at: string }[];

  const assetsByType: Record<string, number> = {};
  for (const asset of assets) {
    assetsByType[asset.type] = (assetsByType[asset.type] || 0) + 1;
  }

  const output: MediaLibraryOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalAssets: assets.length,
    assetsByType,
    assets: assets.map(a => ({
      id: a.id,
      productId: a.product_id,
      productSlug: a.product_slug,
      type: a.type,
      url: a.url,
      alt: a.alt,
      width: a.width,
      height: a.height,
      hash: a.hash,
    })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "media-library.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateSEOLibraryJson(siteUrl: string): SEOLibraryOutput {
  const products = db.prepare(`
    SELECT * FROM extracted_products WHERE status = 'completed' ORDER BY category, title
  `).all() as ExtractedProduct[];

  const productsWithSEO = products.filter(p => {
    const seo = safeJsonParse(p.seo_json, {} as Record<string, unknown>);
    return seo.title || seo.metaDescription;
  });

  const output: SEOLibraryOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    productsWithSEO: productsWithSEO.length,
    coveragePercent: products.length > 0 ? Math.round((productsWithSEO.length / products.length) * 100) : 0,
    products: products.map(p => {
      const seo = safeJsonParse(p.seo_json, {} as ProductSEO);
      const schema = safeJsonParse(p.schema_json, [] as ProductSchema[]);
      return {
        slug: p.slug,
        url: p.url,
        seo,
        hasSchema: schema.length > 0,
      };
    }),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "seo-library.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

export function generateSchemaLibraryJson(siteUrl: string): SchemaLibraryOutput {
  const products = db.prepare(`
    SELECT * FROM extracted_products WHERE status = 'completed' ORDER BY category, title
  `).all() as ExtractedProduct[];

  const productsWithSchema = products.filter(p => {
    const schema = safeJsonParse(p.schema_json, [] as unknown[]);
    return schema.length > 0;
  });

  const schemaTypes: Record<string, number> = {};
  for (const p of productsWithSchema) {
    const schemas = safeJsonParse(p.schema_json, [] as ProductSchema[]);
    for (const s of schemas) {
      schemaTypes[s.type] = (schemaTypes[s.type] || 0) + 1;
    }
  }

  const output: SchemaLibraryOutput = {
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    productsWithSchema: productsWithSchema.length,
    coveragePercent: products.length > 0 ? Math.round((productsWithSchema.length / products.length) * 100) : 0,
    schemaTypes,
    products: productsWithSchema.map(p => ({
      slug: p.slug,
      url: p.url,
      schemas: safeJsonParse(p.schema_json, [] as ProductSchema[]),
    })),
  };

  const outDir = getOutputDir();
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, "schema-library.json"),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  return output;
}

function getPrimaryImage(imagesJson: string): string | null {
  const images = safeJsonParse(imagesJson, [] as ProductImage[]);
  if (images.length === 0) return null;
  const primary = images.find(i => i.isPrimary);
  return primary?.url || images[0]?.url || null;
}
