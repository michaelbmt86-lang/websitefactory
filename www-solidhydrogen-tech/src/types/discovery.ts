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
  | "manual"
  | "discovery-classification"
  | "url-pattern"
  | "jsonld-classification"
  | "none";

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

export type ExtractionEngineName = "chrome-devtools-mcp" | "jcodesmore-browser" | "firecrawl";

export type RecoveryStatus = "primary" | "recovery-l1" | "recovery-l2" | "failed";

export interface ExtractionEngineResult {
  success: boolean;
  engine: ExtractionEngineName;
  html: string | null;
  title: string | null;
  durationMs: number;
  error?: string;
}

export interface ExtractionMetrics {
  id: number;
  url: string;
  primary_engine: string;
  successful_engine: string | null;
  attempts: number;
  duration_ms: number;
  failure_reason: string | null;
  status: string;
  created_at: string;
}

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
  extraction_engine: string;
  last_attempt: string;
  failure_reason: string;
  recovery_status: string;
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
  extraction_engine?: string;
  last_attempt?: string;
  failure_reason?: string;
  recovery_status?: string;
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
// CMS GENERATOR TYPES
// ============================================================================

export type CmsPageStatus = "draft" | "published" | "archived";
export type CmsEntityType = "page" | "product" | "brand" | "collection" | "blog" | "category";

export interface CmsPage {
  id: number;
  url: string;
  slug: string;
  title: string;
  description: string;
  page_type: string;
  source_table: string;
  source_id: number | null;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical: string;
  schema_json: string;
  status: CmsPageStatus;
  created_at: string;
  updated_at: string;
}

export interface CmsPageInput {
  url: string;
  slug: string;
  title: string;
  description?: string;
  page_type?: string;
  source_table?: string;
  source_id?: number | null;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical?: string;
  schema_json?: string;
  status?: CmsPageStatus;
}

export interface CmsBrand {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  product_count: number;
  created_at: string;
}

export interface CmsBrandInput {
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  product_count?: number;
}

export interface CmsCollection {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count: number;
  products_json: string;
  created_at: string;
}

export interface CmsCollectionInput {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count?: number;
  products_json?: string;
}

export interface CmsSeoPage {
  id: number;
  url: string;
  slug: string;
  page_type: string;
  entity_type: CmsEntityType;
  entity_id: number | null;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical: string;
  schema_json: string;
  created_at: string;
}

export interface CmsSeoPageInput {
  url: string;
  slug: string;
  page_type?: string;
  entity_type: CmsEntityType;
  entity_id?: number | null;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical?: string;
  schema_json?: string;
}

export interface CmsSearchIndex {
  id: number;
  entity_type: CmsEntityType;
  entity_id: number;
  title: string;
  description: string;
  keywords: string;
  url: string;
  image_url: string;
  category: string;
  created_at: string;
}

export interface CmsSearchIndexInput {
  entity_type: CmsEntityType;
  entity_id: number;
  title: string;
  description?: string;
  keywords?: string;
  url: string;
  image_url?: string;
  category?: string;
}

export interface CmsGeneratorResult {
  siteUrl: string;
  startTimeMs: number;
  endTimeMs: number;
  generationTimeMs: number;
  pagesGenerated: number;
  brandsGenerated: number;
  collectionsGenerated: number;
  blogPostsGenerated: number;
  seoPagesGenerated: number;
  searchIndexEntries: number;
  totalMediaAssets: number;
  seoCoverage: number;
  searchCoverage: number;
  brokenLinks: number;
  missingMetadata: number;
  generationSuccessRate: number;
}

export interface CmsQualityResult {
  totalEntities: number;
  missingMetadata: number;
  missingSeo: number;
  brokenLinks: number;
  duplicateSlugs: number;
  emptyDescriptions: number;
  issues: CmsQualityIssue[];
}

export interface CmsQualityIssue {
  entityType: CmsEntityType;
  entityId: number;
  entitySlug: string;
  issueType: "missing-metadata" | "missing-seo" | "broken-link" | "duplicate-slug" | "empty-description" | "missing-image";
  severity: "warning" | "error";
  message: string;
}

export interface CmsManifestOutput {
  siteUrl: string;
  generatedAt: string;
  version: string;
  pages: {
    url: string;
    slug: string;
    title: string;
    pageType: string;
    status: string;
  }[];
  brands: {
    name: string;
    slug: string;
    productCount: number;
  }[];
  collections: {
    name: string;
    slug: string;
    productCount: number;
  }[];
  categories: {
    name: string;
    slug: string;
  }[];
  blog: {
    title: string;
    slug: string;
    excerpt: string;
  }[];
  totalEntities: number;
}

export interface CmsSearchOutput {
  siteUrl: string;
  generatedAt: string;
  totalEntries: number;
  entries: {
    entityType: string;
    entityId: number;
    title: string;
    description: string;
    keywords: string;
    url: string;
    imageUrl: string;
    category: string;
  }[];
}

export interface CmsNavigationOutput {
  siteUrl: string;
  generatedAt: string;
  mainNav: {
    label: string;
    href: string;
    children?: { label: string; href: string }[];
  }[];
  footerNav: {
    section: string;
    links: { label: string; href: string }[];
  }[];
}

export interface CmsSitemapOutput {
  siteUrl: string;
  generatedAt: string;
  totalUrls: number;
  urls: {
    url: string;
    lastmod: string;
    changefreq: string;
    priority: number;
  }[];
}

// ============================================================================
// DEPLOYMENT MANIFEST (CMS Generator → Website Builder → Delivery)
// ============================================================================

export interface DeploymentManifest {
  siteUrl: string;
  generatedAt: string;
  projectName: string;
  projectSlug: string;
  targetDomain: string;
  environment: string;
  artifacts: {
    siteMap: string;
    urlGraph: string;
    crawlSummary: string;
    deliveryReport: string;
    websiteManifest: string;
    searchIndex: string;
    navigation: string;
    sitemap: string;
    sitemapXml: string;
    verificationReport: string;
    auditReport: string;
    repairReport: string;
  };
  summary: {
    totalSiteUrls: number;
    totalProductUrls: number;
    totalExtractedProducts: number;
    totalCmsPages: number;
    totalBrands: number;
    totalCollections: number;
    totalBlogPosts: number;
    seoCoverage: number;
    searchCoverage: number;
  };
}

// ============================================================================
// DELIVERY & VERIFICATION TYPES
// ============================================================================

export type VerificationStatus = "PASS" | "WARNING" | "FAILED" | "SKIPPED";
export type AuditSeverity = "error" | "warning" | "info";
export type RepairAction = "fixed" | "skipped" | "failed";

export interface VerificationCheck {
  name: string;
  status: VerificationStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface VerificationReport {
  id: number;
  site_url: string;
  timestamp: string;
  total_checks: number;
  passed_checks: number;
  warning_checks: number;
  failed_checks: number;
  skipped_checks: number;
  overall_status: VerificationStatus;
  pages_json: string;
  products_json: string;
  media_json: string;
  links_json: string;
  seo_json: string;
  schema_json: string;
  navigation_json: string;
  build_json: string;
  deployment_json: string;
  created_at: string;
}

export interface AuditIssue {
  category: string;
  severity: AuditSeverity;
  message: string;
  entity_type: string;
  entity_id: number | null;
  entity_slug: string;
  fixable: boolean;
}

export interface AuditReport {
  id: number;
  site_url: string;
  timestamp: string;
  total_issues: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  fixable_count: number;
  overall_status: VerificationStatus;
  issues_json: string;
  created_at: string;
}

export interface RepairActionRecord {
  category: string;
  action: RepairAction;
  message: string;
  entity_type: string;
  entity_id: number | null;
  entity_slug: string;
  before_value: string;
  after_value: string;
}

export interface RepairReport {
  id: number;
  site_url: string;
  timestamp: string;
  total_actions: number;
  fixed_count: number;
  skipped_count: number;
  failed_count: number;
  overall_status: VerificationStatus;
  actions_json: string;
  created_at: string;
}

export interface DeploymentReport {
  id: number;
  site_url: string;
  timestamp: string;
  git_status: string;
  commit_count: number;
  last_commit: string;
  build_output: string;
  build_success: boolean;
  vercel_status: string;
  cloudflare_status: string;
  env_vars_count: number;
  overall_status: VerificationStatus;
  details_json: string;
  created_at: string;
}

export interface VerificationResult {
  siteUrl: string;
  startTimeMs: number;
  endTimeMs: number;
  verificationTimeMs: number;
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  skippedChecks: number;
  overallStatus: VerificationStatus;
  auditIssues: number;
  auditFixable: number;
  repairsAttempted: number;
  repairsFixed: number;
  buildStatus: VerificationStatus;
  deploymentStatus: VerificationStatus;
}

export interface FullDeliveryReport {
  siteUrl: string;
  generatedAt: string;
  verification: {
    overallStatus: VerificationStatus;
    totalChecks: number;
    passedChecks: number;
    warningChecks: number;
    failedChecks: number;
    pagesVerified: number;
    productsVerified: number;
    mediaVerified: number;
    linksVerified: number;
    seoVerified: number;
    schemaVerified: number;
  };
  audit: {
    overallStatus: VerificationStatus;
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    fixableCount: number;
  };
  repair: {
    overallStatus: VerificationStatus;
    totalActions: number;
    fixedCount: number;
    skippedCount: number;
    failedCount: number;
  };
  build: {
    status: VerificationStatus;
    typecheck: VerificationStatus;
    lint: VerificationStatus;
    build: VerificationStatus;
  };
  deployment: {
    status: VerificationStatus;
    gitClean: boolean;
    lastCommit: string;
    vercelStatus: string;
    cloudflareStatus: string;
  };
  overallSuccessRate: number;
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
  cmsGenerator: {
    pagesGenerated: number;
    brandsGenerated: number;
    collectionsGenerated: number;
    blogPostsGenerated: number;
    seoCoverage: number;
    searchCoverage: number;
    brokenLinks: number;
    missingMetadata: number;
    generationSuccessRate: number;
  };
  extractionRecovery: {
    chromeMcpSuccessRate: number;
    jcodesmoreRecoveryCount: number;
    firecrawlRecoveryCount: number;
    recoverySuccessRate: number;
    averageRetryCount: number;
    averageExtractionTimeMs: number;
    totalFailedUrls: number;
    overallExtractionSuccessRate: number;
  };
  verification: {
    overallStatus: VerificationStatus;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    auditIssues: number;
    repairsFixed: number;
    buildStatus: VerificationStatus;
    deploymentStatus: VerificationStatus;
  };
  status: "PASS" | "FAIL";
  checks: {
    typecheck: "PASS" | "FAIL";
    lint: "PASS" | "FAIL";
    build: "PASS" | "FAIL";
    discovery: "PASS" | "FAIL";
    productDiscovery: "PASS" | "FAIL";
    detailExtraction: "PASS" | "FAIL";
    cmsGenerator: "PASS" | "FAIL";
    verification: "PASS" | "FAIL";
    dashboard: "PASS" | "FAIL";
  };
}
