// ============================================================================
// DISCOVERY TYPES (Site + Product + Detail Extraction Engines)
//
// Reusable types for website crawling, URL graph building, page classification,
// product discovery, and full detail extraction. No site-specific logic.
// ============================================================================

// ============================================================================
// SITE DISCOVERY TYPES
// ============================================================================

export type PageType =
  | "Home"
  | "Category"
  | "Product Listing"
  | "Product Detail"
  | "Blog"
  | "Article"
  | "Landing"
  | "Contact"
  | "Policy"
  | "Dashboard"
  | "Login"
  | "Search"
  | "Tag"
  | "Author"
  | "Archive"
  | "Unknown";

export type UrlStatus = "discovered" | "crawled" | "failed" | "skipped" | "broken";

export type DiscoverySource =
  | "header-nav"
  | "footer-nav"
  | "mega-menu"
  | "breadcrumb"
  | "anchor-link"
  | "xml-sitemap"
  | "robots-txt"
  | "canonical"
  | "meta"
  | "page-body";

export interface SiteUrl {
  id: number;
  url: string;
  slug: string;
  depth: number;
  parent_url: string | null;
  page_type: PageType;
  status: UrlStatus;
  priority: number;
  discovered_by: string;
  title: string;
  meta_description: string;
  canonical_url: string | null;
  h1: string;
  internal_links: number;
  external_links: number;
  images: number;
  json_ld: string | null;
  status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface SiteUrlInput {
  url: string;
  slug: string;
  depth: number;
  parent_url: string | null;
  page_type: PageType;
  status: UrlStatus;
  priority: number;
  discovered_by: string;
  title?: string;
  meta_description?: string;
  canonical_url?: string | null;
  h1?: string;
  internal_links?: number;
  external_links?: number;
  images?: number;
  json_ld?: string | null;
  status_code?: number | null;
  response_time_ms?: number | null;
}

export interface UrlGraphNode {
  id: string;
  url: string;
  slug: string;
  depth: number;
  parent: string | null;
  pageType: PageType;
  status: UrlStatus;
  priority: number;
  discoveredBy: string[];
  children: string[];
}

export interface UrlGraph {
  nodes: Record<string, UrlGraphNode>;
  root: string;
  maxDepth: number;
  totalUrls: number;
  edges: UrlGraphEdge[];
}

export interface UrlGraphEdge {
  source: string;
  target: string;
  type: "navigation" | "content" | "sitemap" | "canonical";
}

export interface SitemapEntry {
  url: string;
  lastmod: string | null;
  changefreq: string | null;
  priority: number;
}

export interface RobotsTxtResult {
  sitemaps: string[];
  disallowedPaths: string[];
  crawlDelay: number | null;
}

export interface PageMetadata {
  title: string;
  metaDescription: string;
  canonical: string | null;
  h1: string;
  jsonLd: Record<string, unknown> | null;
  internalLinks: string[];
  externalLinks: string[];
  images: string[];
  headerNavLinks: FooterNavLink[];
  footerNavLinks: FooterNavLink[];
  breadcrumbs: BreadcrumbItem[];
}

export interface HeaderNavLink {
  label: string;
  href: string;
  children?: HeaderNavLink[];
}

export interface FooterNavLink {
  label: string;
  href: string;
  section?: string;
}

export interface BreadcrumbItem {
  label: string;
  href: string | null;
}

export interface MegaMenuData {
  trigger: string;
  columns: MegaMenuColumn[];
}

export interface MegaMenuColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface SiteDiscoveryResult {
  siteUrl: string;
  discoveredAt: string;
  totalUrls: number;
  maxDepth: number;
  urlsByType: Record<PageType, number>;
  urlsByStatus: Record<UrlStatus, number>;
  brokenUrls: { url: string; statusCode: number | null; parentUrl: string | null }[];
  depthStats: Record<number, number>;
  topPages: SiteUrl[];
  sitemaps: string[];
  robotsTxt: RobotsTxtResult | null;
}

export interface CrawlSummary {
  siteUrl: string;
  discoveredAt: string;
  totalUrls: number;
  crawledUrls: number;
  brokenUrls: number;
  skippedUrls: number;
  maxDepth: number;
  averageDepth: number;
  urlsByType: Record<PageType, number>;
  urlsByStatus: Record<UrlStatus, number>;
  depthDistribution: Record<string, number>;
  discoverySources: Record<string, number>;
  topPages: { url: string; pageType: PageType; depth: number }[];
}

// ============================================================================
// PRODUCT DISCOVERY TYPES
// ============================================================================

export type ProductCategory =
  | "Packaging"
  | "Cup"
  | "Lid"
  | "Container"
  | "Bag"
  | "Cutlery"
  | "Napkin"
  | "Accessory"
  | "Custom Product"
  | "Unknown";

export type ProductUrlStatus = "discovered" | "crawled" | "failed" | "broken" | "duplicate";

export type ProductDiscoverySource =
  | "listing-page"
  | "category-page"
  | "collection-page"
  | "search-page"
  | "shop-page"
  | "sitemap"
  | "pagination"
  | "load-more"
  | "infinite-scroll"
  | "ajax"
  | "manual";

export interface ProductUrl {
  id: number;
  url: string;
  category: string;
  product_slug: string;
  product_name: string;
  source_page: string;
  discovered_by: string;
  status: ProductUrlStatus;
  priority: number;
  canonical_url: string | null;
  json_ld: string | null;
  price: string | null;
  sku: string | null;
  image_url: string | null;
  in_stock: number;
  is_duplicate: number;
  duplicate_of: string | null;
  status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface ProductUrlInput {
  url: string;
  category: string;
  product_slug: string;
  product_name: string;
  source_page: string;
  discovered_by: ProductDiscoverySource;
  status: ProductUrlStatus;
  priority: number;
  canonical_url?: string | null;
  json_ld?: string | null;
  price?: string | null;
  sku?: string | null;
  image_url?: string | null;
  in_stock?: number;
  is_duplicate?: number;
  duplicate_of?: string | null;
  status_code?: number | null;
  response_time_ms?: number | null;
}

export interface PaginationInfo {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
  totalPages: number | null;
  currentPage: number | null;
  loadMoreUrl: string | null;
  paginationType: "links" | "load-more" | "infinite-scroll" | "ajax" | "none";
}

export interface ProductListingPageData {
  url: string;
  title: string;
  productLinks: string[];
  pagination: PaginationInfo;
  totalProductsOnPage: number;
}

export interface ProductDiscoveryResult {
  siteUrl: string;
  discoveredAt: string;
  startTimeMs: number;
  endTimeMs: number;
  discoveryTimeMs: number;
  totalProducts: number;
  totalCategories: number;
  productsByCategory: Record<string, number>;
  duplicatesFound: number;
  brokenProducts: number;
  pagesCrawled: number;
  paginationPagesCrawled: number;
  maxDepth: number;
  listingPages: string[];
  categoryPages: string[];
  topProducts: ProductUrl[];
}

export interface ProductIndexOutput {
  siteUrl: string;
  generatedAt: string;
  totalProducts: number;
  products: {
    url: string;
    slug: string;
    name: string;
    category: string;
    price: string | null;
    sku: string | null;
    imageUrl: string | null;
    inStock: boolean;
    isDuplicate: boolean;
    sourcePage: string;
  }[];
}

export interface CategoryIndexOutput {
  siteUrl: string;
  generatedAt: string;
  totalCategories: number;
  categories: {
    name: string;
    productCount: number;
    listingPage: string;
    products: { url: string; slug: string; name: string }[];
  }[];
}

export interface ProductDiscoverySummaryOutput {
  siteUrl: string;
  generatedAt: string;
  discoveryTimeMs: number;
  totalProducts: number;
  totalCategories: number;
  duplicatesFound: number;
  brokenProducts: number;
  pagesCrawled: number;
  paginationPagesCrawled: number;
  productsByCategory: Record<string, number>;
  productsByStatus: Record<string, number>;
  topListingPages: { url: string; productsFound: number }[];
}

// ============================================================================
// DETAIL EXTRACTION TYPES
// ============================================================================

export type ExtractionStatus = "pending" | "extracting" | "completed" | "failed" | "retrying";

export interface ExtractedProduct {
  id: number;
  url: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  short_description: string;
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  sku: string;
  language: string;
  images_json: string;
  gallery_json: string;
  downloads_json: string;
  specifications_json: string;
  seo_json: string;
  schema_json: string;
  related_products_json: string;
  faq_json: string;
  status: ExtractionStatus;
  error_message: string;
  retry_count: number;
  extraction_time_ms: number;
  created_at: string;
  updated_at: string;
}

export interface ExtractedProductInput {
  url: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  short_description?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  sku?: string;
  language?: string;
  images_json?: string;
  gallery_json?: string;
  downloads_json?: string;
  specifications_json?: string;
  seo_json?: string;
  schema_json?: string;
  related_products_json?: string;
  faq_json?: string;
  status?: ExtractionStatus;
  error_message?: string;
  retry_count?: number;
  extraction_time_ms?: number;
}

export interface MediaAsset {
  id: number;
  product_id: number;
  type: "image" | "video" | "pdf" | "download" | "thumbnail";
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  hash: string;
  created_at: string;
}

export interface MediaAssetInput {
  product_id: number;
  type: "image" | "video" | "pdf" | "download" | "thumbnail";
  url: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  hash?: string;
}

export interface ProductImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  isThumbnail: boolean;
}

export interface ProductVideo {
  url: string;
  thumbnailUrl: string | null;
  title: string;
  duration: string | null;
}

export interface ProductDownload {
  url: string;
  title: string;
  type: string;
  size: string | null;
}

export interface ProductSpecification {
  name: string;
  value: string;
  group: string;
}

export interface ProductSEO {
  title: string;
  metaDescription: string;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
}

export interface ProductSchema {
  type: string;
  data: Record<string, unknown>;
  rawJsonLd: string;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface ProductRelatedProduct {
  url: string;
  name: string;
  imageUrl: string | null;
  price: string | null;
  relationship: "related" | "cross-sell" | "up-sell";
}

export interface ProductPageStructure {
  breadcrumbs: { label: string; href: string | null }[];
  tags: string[];
  collection: string;
  mainContent: string;
  sidebar: string;
  ctas: { text: string; href: string | null }[];
  accordions: { title: string; content: string }[];
  tabs: { title: string; content: string }[];
  reviews: { rating: number | null; count: number | null; text: string }[];
  tables: { title: string; rows: { label: string; value: string }[] }[];
  lists: string[];
  forms: { action: string; fields: string[] }[];
}

export interface NetworkCapturedData {
  xhrRequests: { url: string; method: string; status: number | null; responseJson: unknown | null }[];
  fetchRequests: { url: string; method: string; status: number | null; responseJson: unknown | null }[];
  jsonApiResponses: { url: string; data: unknown }[];
  hiddenData: unknown[];
  lazyLoadedContent: unknown[];
}

export interface DetailExtractionResult {
  siteUrl: string;
  startTimeMs: number;
  endTimeMs: number;
  extractionTimeMs: number;
  totalProducts: number;
  extractedProducts: number;
  failedProducts: number;
  retriedProducts: number;
  productsWithImages: number;
  productsWithSEO: number;
  productsWithSchema: number;
  productsWithSpecs: number;
  productsWithFAQ: number;
  productsWithDownloads: number;
  totalImages: number;
  totalDownloads: number;
  totalMediaAssets: number;
  extractionCoverage: number;
  seoCoverage: number;
  schemaCoverage: number;
  imagesCoverage: number;
  specsCoverage: number;
}

export interface QualityCheckResult {
  totalProducts: number;
  missingImages: number;
  missingSEO: number;
  missingSchema: number;
  brokenDownloads: number;
  brokenMedia: number;
  duplicateProducts: number;
  duplicateImages: number;
  missingSpecs: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  productUrl: string;
  productSlug: string;
  issueType: "missing-image" | "missing-seo" | "missing-schema" | "broken-download" | "broken-media" | "duplicate-product" | "duplicate-image" | "missing-specs";
  severity: "warning" | "error";
  message: string;
}

export interface ProductsJsonOutput {
  siteUrl: string;
  generatedAt: string;
  totalProducts: number;
  products: {
    url: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    shortDescription: string;
    category: string;
    subcategory: string;
    brand: string;
    model: string;
    sku: string;
    language: string;
    primaryImage: string | null;
    galleryImages: ProductImage[];
    downloads: ProductDownload[];
    specifications: ProductSpecification[];
    seo: ProductSEO;
    schema: ProductSchema[];
    relatedProducts: ProductRelatedProduct[];
    faq: ProductFAQ[];
    status: string;
  }[];
}

export interface MediaLibraryOutput {
  siteUrl: string;
  generatedAt: string;
  totalAssets: number;
  assetsByType: Record<string, number>;
  assets: {
    id: number;
    productId: number;
    productSlug: string;
    type: string;
    url: string;
    alt: string;
    width: number | null;
    height: number | null;
    hash: string;
  }[];
}

export interface SEOLibraryOutput {
  siteUrl: string;
  generatedAt: string;
  totalProducts: number;
  productsWithSEO: number;
  coveragePercent: number;
  products: {
    slug: string;
    url: string;
    seo: ProductSEO;
    hasSchema: boolean;
  }[];
}

export interface SchemaLibraryOutput {
  siteUrl: string;
  generatedAt: string;
  totalProducts: number;
  productsWithSchema: number;
  coveragePercent: number;
  schemaTypes: Record<string, number>;
  products: {
    slug: string;
    url: string;
    schemas: ProductSchema[];
  }[];
}

// ============================================================================
// DELIVERY REPORT
// ============================================================================

export interface DeliveryReport {
  generatedAt: string;
  siteUrl: string;
  discovery: {
    totalUrls: number;
    categories: number;
    discoveryCoverage: number;
    brokenUrls: number;
    depthStatistics: {
      maxDepth: number;
      averageDepth: number;
      distribution: Record<string, number>;
    };
    pageTypeBreakdown: Record<PageType, number>;
  };
  productDiscovery: {
    totalProducts: number;
    totalCategories: number;
    duplicateCount: number;
    brokenProductUrls: number;
    coveragePercent: number;
    discoveryTimeMs: number;
    productsByCategory: Record<string, number>;
  };
  detailExtraction: {
    productsExtracted: number;
    images: number;
    downloads: number;
    specifications: number;
    seoCoverage: number;
    schemaCoverage: number;
    brokenAssets: number;
    extractionSuccessRate: number;
  };
  status: "PASS" | "FAIL";
  checks: {
    typecheck: "PASS" | "FAIL";
    lint: "PASS" | "FAIL";
    build: "PASS" | "FAIL";
    discovery: "PASS" | "FAIL";
    productDiscovery: "PASS" | "FAIL";
    detailExtraction: "PASS" | "FAIL";
    dashboard: "PASS" | "FAIL";
  };
}
