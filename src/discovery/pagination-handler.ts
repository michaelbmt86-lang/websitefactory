// ============================================================================
// PAGINATION HANDLER (Product Discovery Engine)
//
// Detects and handles all common pagination patterns:
//   - Traditional next/prev links
//   - Load More buttons
//   - Infinite scroll (via data attributes / scripts)
//   - AJAX product loading
//   - Numbered page links
// Reusable — no site-specific logic.
// ============================================================================

import type { PaginationInfo } from "@/types/discovery";

export function detectPagination(html: string, currentUrl: string): PaginationInfo {
  const result: PaginationInfo = {
    hasNextPage: false,
    hasPrevPage: false,
    nextPageUrl: null,
    prevPageUrl: null,
    totalPages: null,
    currentPage: null,
    loadMoreUrl: null,
    paginationType: "none",
  };

  // 1. Try next/prev link relations
  const nextLink = extractRelLink(html, "next");
  const prevLink = extractRelLink(html, "prev");

  if (nextLink) {
    result.hasNextPage = true;
    result.nextPageUrl = resolveUrl(nextLink, currentUrl);
    result.paginationType = "links";
  }
  if (prevLink) {
    result.hasPrevPage = true;
    result.prevPageUrl = resolveUrl(prevLink, currentUrl);
  }

  // 2. Try numbered pagination links
  const numberPagination = detectNumberedPagination(html);
  if (numberPagination.totalPages) {
    result.totalPages = numberPagination.totalPages;
  }
  if (numberPagination.currentPage) {
    result.currentPage = numberPagination.currentPage;
  }

  // 3. Try "Next Page" button patterns
  if (!result.nextPageUrl) {
    const nextBtnUrl = detectNextButton(html, currentUrl);
    if (nextBtnUrl) {
      result.hasNextPage = true;
      result.nextPageUrl = nextBtnUrl;
      result.paginationType = "links";
    }
  }

  // 4. Try "Load More" button
  const loadMoreUrl = detectLoadMore(html, currentUrl);
  if (loadMoreUrl) {
    result.loadMoreUrl = loadMoreUrl;
    result.hasNextPage = true;
    if (result.paginationType === "none") {
      result.paginationType = "load-more";
    }
  }

  // 5. Detect infinite scroll patterns
  if (detectInfiniteScroll(html)) {
    result.hasNextPage = true;
    if (result.paginationType === "none") {
      result.paginationType = "infinite-scroll";
    }
  }

  // 6. Detect AJAX product loading
  if (detectAjaxLoading(html)) {
    result.hasNextPage = true;
    if (result.paginationType === "none") {
      result.paginationType = "ajax";
    }
  }

  return result;
}

function extractRelLink(html: string, rel: string): string | null {
  // Standard <link rel="next">
  const linkMatch = html.match(
    new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']+)["']`, "i")
  );
  if (linkMatch) return linkMatch[1];

  // Reversed attribute order
  const revMatch = html.match(
    new RegExp(`<link[^>]*href=["']([^"']+)["'][^>]*rel=["']${rel}["']`, "i")
  );
  if (revMatch) return revMatch[1];

  return null;
}

function detectNumberedPagination(html: string): { totalPages: number | null; currentPage: number | null } {
  // Look for pagination container
  const paginationPatterns = [
    /<nav[^>]*class=["'][^"']*(?:pagination|pager|page-nav|pages|paginat)[^"']*["'][^>]*>([\s\S]*?)<\/nav>/gi,
    /<div[^>]*class=["'][^"']*(?:pagination|pager|page-nav|pages|paginat)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    /<ul[^>]*class=["'][^"']*(?:pagination|pager|page-nav|pages|paginat)[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi,
  ];

  for (const pattern of paginationPatterns) {
    const match = pattern.exec(html);
    if (!match) continue;

    const paginationHtml = match[1];

    // Extract page numbers
    const pageLinks = [...paginationHtml.matchAll(/href=["'][^"']*?(?:page|p|pg)[=/](\d+)/gi)];
    if (pageLinks.length > 0) {
      const pageNumbers = pageLinks.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n));
      const maxPage = Math.max(...pageNumbers);
      const totalPages = Math.max(maxPage, pageNumbers.length);

      // Try to detect current page
      const currentPageMatch = paginationHtml.match(/class=["'][^"']*(?:active|current|selected)[^"']*["'][^>]*>[\s\S]*?(\d+)/i);
      const currentPage = currentPageMatch ? parseInt(currentPageMatch[1], 10) : 1;

      return { totalPages, currentPage: currentPage || 1 };
    }

    // Try aria-label patterns
    const ariaLabels = [...paginationHtml.matchAll(/aria-label=["']([^"']+)["']/gi)];
    const lastPage = ariaLabels.find(a => /last|page\s+\d+/i.test(a[1]));
    if (lastPage) {
      const numMatch = lastPage[1].match(/(\d+)/);
      if (numMatch) return { totalPages: parseInt(numMatch[1], 10), currentPage: 1 };
    }
  }

  return { totalPages: null, currentPage: null };
}

function detectNextButton(html: string, currentUrl: string): string | null {
  const nextPatterns = [
    // "Next Page" link patterns
    /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*(?:next|pagination-next|page-next)[^"']*["'][^>]*>/gi,
    /<a[^>]*class=["'][^"']*(?:next|pagination-next|page-next)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
    // "Next" text in links
    /<a[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Next|›|»|→|>&gt;)\s*<\/a>/gi,
    // Next with arrow characters
    /<a[^>]*href=["']([^"']+)["'][^>]*aria-label=["'][^"']*(?:next|forward)[^"']*["'][^>]*>/gi,
    // data-page attributes
    /<a[^>]*data-page=["'][^"']*["'][^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*(?:next)[^"']*["'][^>]*>/gi,
  ];

  for (const pattern of nextPatterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      const url = resolveUrl(match[1], currentUrl);
      if (url) return url;
    }
  }

  return null;
}

function detectLoadMore(html: string, currentUrl: string): string | null {
  const loadMorePatterns = [
    // Load more button with href
    /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*(?:load.?more|show.?more|view.?more|see.?more)[^"']*["'][^>]*>/gi,
    /<a[^>]*class=["'][^"']*(?:load.?more|show.?more|view.?more|see.?more)[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
    // Load more with data attributes
    /<(?:a|button)[^>]*data-(?:url|href|action)=["']([^"']+)["'][^>]*class=["'][^"']*(?:load.?more|show.?more)[^"']*["'][^>]*>/gi,
    // Load more with onclick
    /<(?:a|button)[^>]*onclick=["'][^"']*["']([^"']+)["'][^"']*class=["'][^"']*(?:load.?more|show.?more)[^"']*["'][^>]*>/gi,
  ];

  for (const pattern of loadMorePatterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      const url = resolveUrl(match[1], currentUrl);
      if (url) return url;
    }
  }

  return null;
}

function detectInfiniteScroll(html: string): boolean {
  const infiniteScrollIndicators = [
    /data-infinite-scroll/i,
    /data-infinite/i,
    /infinite.?scroll/i,
    /data-lazy.?load/i,
    /data-load.?on.?scroll/i,
    /IntersectionObserver/i,
    /waypoint/i,
    /data-next.?page/i,
    /class=["'][^"']*(?:infinite-scroll|lazy-load|load-on-scroll)[^"']*["']/i,
  ];

  return infiniteScrollIndicators.some(pattern => pattern.test(html));
}

function detectAjaxLoading(html: string): boolean {
  const ajaxIndicators = [
    /data-ajax/i,
    /data-paged/i,
    /data-products.?url/i,
    /data-api.?url/i,
    /fetch\s*\(\s*["'][^"']*product/i,
    /\.get\s*\(\s*["'][^"']*product/i,
    /data-offset/i,
    /wp.?ajax/i,
    /admin-ajax/i,
    /rest.?api.*product/i,
  ];

  return ajaxIndicators.some(pattern => pattern.test(html));
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

export function buildPaginationQueue(
  startUrl: string,
  pagination: PaginationInfo,
  maxPages: number = 100
): string[] {
  const urls: string[] = [];

  if (pagination.nextPageUrl) {
    urls.push(pagination.nextPageUrl);
  }

  if (pagination.totalPages && pagination.currentPage) {
    // Generate URLs for remaining pages
    const baseUrl = new URL(startUrl);
    for (let page = pagination.currentPage + 1; page <= pagination.totalPages && urls.length < maxPages; page++) {
      // Try common pagination URL patterns
      const pageUrl = generatePageUrl(baseUrl, page);
      if (pageUrl && !urls.includes(pageUrl)) {
        urls.push(pageUrl);
      }
    }
  }

  return urls.slice(0, maxPages);
}

function generatePageUrl(base: URL, page: number): string | null {
  const href = base.href;

  // ?page=N
  if (base.searchParams.has("page")) {
    base.searchParams.set("page", String(page));
    return base.href;
  }

  // ?p=N
  if (base.searchParams.has("p")) {
    base.searchParams.set("p", String(page));
    return base.href;
  }

  // /page/N pattern
  const pagePathMatch = href.match(/\/page\/\d+/);
  if (pagePathMatch) {
    return href.replace(/\/page\/\d+/, `/page/${page}`);
  }

  // Append /page/N
  const pathname = base.pathname.replace(/\/$/, "");
  return `${base.origin}${pathname}/page/${page}${base.search}`;
}
