// ============================================================================
// EXTRACTION WITH RECOVERY
//
// Wraps the existing extraction pipeline with multi-engine fallback recovery.
// Uses ExtractionManager for automatic engine selection and recovery.
// Preserves the exact same extraction logic — only the fetch layer changes.
// ============================================================================

import db from "@/lib/db";
import type {
  ExtractedProduct,
  DetailExtractionResult,
  ExtractionStatus,
} from "@/types/discovery";
import { extractWithRecovery, type ExtractionManagerOptions } from "./extraction/extraction-manager";
import { normalizeUrl } from "./page-classifier";
import {
  extractTitle,
  extractSubtitle,
  extractDescription,
  extractShortDescription,
  extractImages,
  extractDownloads,
  extractSpecifications,
  extractSEO,
  extractSchema,
  extractFAQ,
  extractPageStructure,
} from "./dom-extractor";
import { extractAllMedia } from "./media-extractor";
import { analyzeNetworkData } from "./network-analyzer";
import { prepareHtmlForExtraction } from "./dynamic-renderer";
import { analyze } from "./analyzer-engine";
import { buildAnalyzerInput } from "./analyzer-input-builder";

interface RecoveryExtractionOptions {
  concurrency?: number;
  maxRetries?: number;
  resumeFromFailure?: boolean;
  managerOptions?: ExtractionManagerOptions;
}

const DEFAULT_OPTIONS: RecoveryExtractionOptions = {
  concurrency: 3,
  maxRetries: 2,
  resumeFromFailure: true,
  managerOptions: { maxRetriesPerEngine: 2, timeoutMs: 30000 },
};

export class RecoveryExtractionEngine {
  private baseUrl: string;
  private options: RecoveryExtractionOptions;
  private startTimeMs = 0;
  private extractedCount = 0;
  private failedCount = 0;
  private retriedCount = 0;

  constructor(baseUrl: string, options: RecoveryExtractionOptions = {}) {
    this.baseUrl = normalizeUrl(baseUrl, baseUrl);
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async extract(): Promise<DetailExtractionResult> {
    this.startTimeMs = Date.now();
    this.extractedCount = 0;
    this.failedCount = 0;
    this.retriedCount = 0;

    const products = this.getProductsToProcess();
    const totalProducts = products.length;

    const concurrency = this.options.concurrency ?? 3;
    for (let i = 0; i < products.length; i += concurrency) {
      const batch = products.slice(i, i + concurrency);
      await Promise.all(batch.map(p => this.extractProduct(p.url, p.product_slug)));
    }

    return this.generateResult(totalProducts);
  }

  private getProductsToProcess(): { url: string; product_slug: string }[] {
    let query = `
      SELECT pu.url, pu.product_slug
      FROM product_urls pu
      LEFT JOIN extracted_products ep ON pu.url = ep.url
      WHERE pu.is_duplicate = 0
        AND pu.status IN ('crawled', 'discovered')
    `;

    if (!this.options.resumeFromFailure) {
      query += ` AND (ep.id IS NULL OR ep.status != 'completed')`;
    } else {
      query += ` AND (ep.id IS NULL OR ep.status IN ('pending', 'failed'))`;
    }

    query += ` ORDER BY pu.priority DESC`;

    return db.prepare(query).all() as { url: string; product_slug: string }[];
  }

  private async extractProduct(url: string, slug: string): Promise<void> {
    const startTime = Date.now();

    this.upsertProduct(url, slug, { status: "extracting" });

    try {
      // Step 1: Multi-engine extraction with automatic recovery
      const extractionResult = await extractWithRecovery(url, this.options.managerOptions);

      if (!extractionResult.success || !extractionResult.html) {
        this.failProduct(url, extractionResult.error || "All extraction engines failed", extractionResult.engine);
        return;
      }

      const html = prepareHtmlForExtraction(extractionResult.html);

      // Step 2: Ensure product exists in DB and get ID
      const productId = this.getProductId(url, slug);
      if (!productId) {
        this.failProduct(url, "Failed to create product record", extractionResult.engine);
        return;
      }

      // Step 3: Extract all DOM data
      const title = extractTitle(html);
      const subtitle = extractSubtitle(html);
      const description = extractDescription(html);
      const shortDescription = extractShortDescription(html);
      const images = extractImages(html, this.baseUrl);
      const downloads = extractDownloads(html, this.baseUrl);
      const specifications = extractSpecifications(html);
      const seo = extractSEO(html);
      const schema = extractSchema(html);
      const faq = extractFAQ(html);
      const pageStructure = extractPageStructure(html);

      // Step 4: Extract and store media assets
      extractAllMedia(html, this.baseUrl, productId);

      // Step 5: Analyze network data
      const networkData = analyzeNetworkData(html);

      // Step 6: Run analyzer for normalization
      const geminiResult = await analyze(buildAnalyzerInput({
        url,
        html,
        schema,
        networkData,
        specifications,
        faq,
        pageStructure,
      }));

      // Step 7: Compute extraction time and record recovery metadata
      const extractionTime = Date.now() - startTime;
      const recoveryStatus = extractionResult.engine === "chrome-devtools-mcp" ? "primary"
        : extractionResult.engine === "jcodesmore-browser" ? "recovery-l1"
        : "recovery-l2";

      const specsJson = JSON.stringify(geminiResult.specifications);
      const relatedJson = JSON.stringify(geminiResult.relatedProducts);
      const faqJson = JSON.stringify(geminiResult.faq);

      db.prepare(`
        UPDATE extracted_products SET
          title = ?,
          subtitle = ?,
          description = ?,
          short_description = ?,
          category = ?,
          subcategory = CASE WHEN ? != '' THEN ? ELSE subcategory END,
          brand = CASE WHEN ? != '' THEN ? ELSE brand END,
          model = CASE WHEN ? != '' THEN ? ELSE model END,
          sku = CASE WHEN ? != '' THEN ? ELSE sku END,
          language = 'en',
          images_json = ?,
          gallery_json = ?,
          downloads_json = ?,
          specifications_json = CASE WHEN ? != '[]' THEN ? ELSE specifications_json END,
          seo_json = ?,
          schema_json = ?,
          related_products_json = CASE WHEN ? != '[]' THEN ? ELSE related_products_json END,
          faq_json = CASE WHEN ? != '[]' THEN ? ELSE faq_json END,
          status = 'completed',
          error_message = '',
          extraction_time_ms = ?,
          extraction_engine = ?,
          last_attempt = CURRENT_TIMESTAMP,
          failure_reason = '',
          recovery_status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE url = ?
      `).run(
        geminiResult.title || title,
        geminiResult.subtitle || subtitle,
        geminiResult.description || description,
        geminiResult.shortDescription || shortDescription,
        geminiResult.category || "Unknown",
        geminiResult.subcategory, geminiResult.subcategory,
        geminiResult.brand, geminiResult.brand,
        geminiResult.model, geminiResult.model,
        geminiResult.sku, geminiResult.sku,
        JSON.stringify(images),
        JSON.stringify(images),
        JSON.stringify(downloads),
        specsJson, specsJson,
        JSON.stringify(seo),
        JSON.stringify(schema),
        relatedJson, relatedJson,
        faqJson, faqJson,
        extractionTime,
        extractionResult.engine,
        recoveryStatus,
        url
      );

      this.extractedCount++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown extraction error";
      this.failProduct(url, errorMsg, "chrome-devtools-mcp");

      // Auto-retry if under limit
      const product = db.prepare("SELECT retry_count FROM extracted_products WHERE url = ?").get(url) as { retry_count: number } | undefined;
      if (product && product.retry_count < (this.options.maxRetries ?? 2)) {
        this.retriedCount++;
        db.prepare("UPDATE extracted_products SET status = 'retrying', retry_count = retry_count + 1 WHERE url = ?").run(url);
        await new Promise(resolve => setTimeout(resolve, 1000 * product.retry_count));
        return this.extractProduct(url, slug);
      }
    }
  }

  private upsertProduct(url: string, slug: string, updates: { status: ExtractionStatus }): void {
    const existing = db.prepare("SELECT id FROM extracted_products WHERE url = ?").get(url);
    if (existing) {
      db.prepare("UPDATE extracted_products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE url = ?").run(updates.status, url);
    } else {
      db.prepare("INSERT INTO extracted_products (url, slug, status) VALUES (?, ?, ?)").run(url, slug, updates.status);
    }
  }

  private getProductId(url: string, slug: string): number | null {
    this.upsertProduct(url, slug, { status: "extracting" });
    const row = db.prepare("SELECT id FROM extracted_products WHERE url = ?").get(url) as { id: number } | undefined;
    return row?.id ?? null;
  }

  private failProduct(url: string, errorMsg: string, engine: string): void {
    db.prepare(`
      UPDATE extracted_products SET
        status = 'failed',
        error_message = ?,
        extraction_engine = ?,
        last_attempt = CURRENT_TIMESTAMP,
        failure_reason = ?,
        recovery_status = 'failed',
        updated_at = CURRENT_TIMESTAMP
      WHERE url = ?
    `).run(errorMsg, engine, errorMsg, url);
    this.failedCount++;
  }

  private generateResult(totalProducts: number): DetailExtractionResult {
    const completed = db.prepare("SELECT COUNT(*) as count FROM extracted_products WHERE status = 'completed'").get() as { count: number };
    const failed = db.prepare("SELECT COUNT(*) as count FROM extracted_products WHERE status = 'failed'").get() as { count: number };

    const allProducts = db.prepare("SELECT * FROM extracted_products WHERE status = 'completed'").all() as ExtractedProduct[];

    let totalImages = 0;
    let totalDownloads = 0;
    let productsWithImages = 0;
    let productsWithSEO = 0;
    let productsWithSchema = 0;
    let productsWithSpecs = 0;
    let productsWithFAQ = 0;
    let productsWithDownloads = 0;

    for (const p of allProducts) {
      const images = safeJsonParse(p.images_json, [] as unknown[]);
      const downloads = safeJsonParse(p.downloads_json, [] as unknown[]);
      const seo = safeJsonParse(p.seo_json, {} as Record<string, unknown>);
      const schema = safeJsonParse(p.schema_json, [] as unknown[]);
      const specs = safeJsonParse(p.specifications_json, [] as unknown[]);
      const faq = safeJsonParse(p.faq_json, [] as unknown[]);

      if (images.length > 0) { productsWithImages++; totalImages += images.length; }
      if (downloads.length > 0) { productsWithDownloads++; totalDownloads += downloads.length; }
      if (seo.title || seo.metaDescription) productsWithSEO++;
      if (schema.length > 0) productsWithSchema++;
      if (specs.length > 0) productsWithSpecs++;
      if (faq.length > 0) productsWithFAQ++;
    }

    const totalMedia = db.prepare("SELECT COUNT(*) as count FROM media_assets").get() as { count: number };

    const endTimeMs = Date.now();
    const extractionTimeMs = endTimeMs - this.startTimeMs;
    const extractionCoverage = totalProducts > 0 ? Math.round((completed.count / totalProducts) * 100) : 0;
    const seoCoverage = totalProducts > 0 ? Math.round((productsWithSEO / totalProducts) * 100) : 0;
    const schemaCoverage = totalProducts > 0 ? Math.round((productsWithSchema / totalProducts) * 100) : 0;
    const imagesCoverage = totalProducts > 0 ? Math.round((productsWithImages / totalProducts) * 100) : 0;
    const specsCoverage = totalProducts > 0 ? Math.round((productsWithSpecs / totalProducts) * 100) : 0;

    return {
      siteUrl: this.baseUrl,
      startTimeMs: this.startTimeMs,
      endTimeMs,
      extractionTimeMs,
      totalProducts,
      extractedProducts: completed.count,
      failedProducts: failed.count,
      retriedProducts: this.retriedCount,
      productsWithImages,
      productsWithSEO,
      productsWithSchema,
      productsWithSpecs,
      productsWithFAQ,
      productsWithDownloads,
      totalImages,
      totalDownloads,
      totalMediaAssets: totalMedia.count,
      extractionCoverage,
      seoCoverage,
      schemaCoverage,
      imagesCoverage,
      specsCoverage,
    };
  }
}

function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

export async function extractProductDetailsWithRecovery(
  baseUrl: string,
  options?: RecoveryExtractionOptions,
): Promise<DetailExtractionResult> {
  const engine = new RecoveryExtractionEngine(baseUrl, options);
  return engine.extract();
}
