// ============================================================================
// DISCOVERY TYPES (Site Discovery Engine)
//
// Reusable types for website crawling, URL graph building, and page classification.
// No site-specific logic — works for any website.
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
  status: "PASS" | "FAIL";
  checks: {
    typecheck: "PASS" | "FAIL";
    lint: "PASS" | "FAIL";
    build: "PASS" | "FAIL";
    discovery: "PASS" | "FAIL";
    productDiscovery: "PASS" | "FAIL";
    dashboard: "PASS" | "FAIL";
  };
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
