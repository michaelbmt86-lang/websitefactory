// ============================================================================
// OUTPUT TYPES (Site Discovery Engine)
//
// Types for the JSON output files. Separate from core types to avoid circular deps.
// ============================================================================

export interface SiteMapOutput {
  siteUrl: string;
  generatedAt: string;
  totalUrls: number;
  urls: {
    url: string;
    slug: string;
    depth: number;
    pageType: string;
    status: string;
    priority: number;
    title: string;
    parentUrl: string | null;
  }[];
}

export interface UrlGraphOutput {
  siteUrl: string;
  generatedAt: string;
  root: string;
  maxDepth: number;
  totalNodes: number;
  totalEdges: number;
  nodes: {
    id: string;
    url: string;
    slug: string;
    depth: number;
    parent: string | null;
    pageType: string;
    status: string;
    priority: number;
    discoveredBy: string[];
    childCount: number;
  }[];
  edges: {
    source: string;
    target: string;
    type: string;
  }[];
}

export interface CrawlSummaryOutput {
  siteUrl: string;
  generatedAt: string;
  totalUrls: number;
  crawledUrls: number;
  brokenUrls: number;
  skippedUrls: number;
  discoveredUrls: number;
  maxDepth: number;
  averageDepth: number;
  urlsByType: Record<string, number>;
  urlsByStatus: Record<string, number>;
  depthDistribution: Record<string, number>;
  discoverySources: Record<string, number>;
  topPages: { url: string; pageType: string; depth: number }[];
}

export interface DeliveryReportOutput {
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
    pageTypeBreakdown: Record<string, number>;
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
