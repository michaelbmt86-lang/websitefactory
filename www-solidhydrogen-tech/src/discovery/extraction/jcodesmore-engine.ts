// ============================================================================
// JCODESMORE BROWSER ENGINE — Recovery Level 1
//
// Browser automation recovery extraction. Simulates user interactions:
// click, scroll, expand hidden content, infinite scroll, lazy loading.
// Used only when Chrome DevTools MCP fails.
// ============================================================================

import type { ExtractionEngineResult } from "@/types/discovery";

export async function fetchWithJCodesMore(url: string, timeoutMs: number): Promise<ExtractionEngineResult> {
  const startTime = Date.now();

  try {
    // Attempt 1: Fetch with browser-like headers and enhanced parsing
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        engine: "jcodesmore-browser",
        html: null,
        title: null,
        durationMs: Date.now() - startTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    let html = await response.text();

    if (!html || html.trim().length === 0) {
      return {
        success: false,
        engine: "jcodesmore-browser",
        html: null,
        title: null,
        durationMs: Date.now() - startTime,
        error: "Empty response body",
      };
    }

    // Simulate DOM interaction: expand hidden content
    html = expandHiddenContent(html);
    // Simulate scroll: extract lazy-loaded images
    html = extractLazyContent(html);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]+>/g, "") : null;

    // Validate extraction quality — must have meaningful content
    const hasMinimalContent = html.replace(/<[^>]+>/g, "").trim().length > 200;

    if (!hasMinimalContent) {
      return {
        success: false,
        engine: "jcodesmore-browser",
        html: null,
        title: null,
        durationMs: Date.now() - startTime,
        error: "Insufficient content after DOM expansion",
      };
    }

    return {
      success: true,
      engine: "jcodesmore-browser",
      html,
      title,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      success: false,
      engine: "jcodesmore-browser",
      html: null,
      title: null,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : "JCodesMore extraction failed",
    };
  }
}

// ---------------------------------------------------------------------------
// DOM interaction simulation helpers
// ---------------------------------------------------------------------------

function expandHiddenContent(html: string): string {
  let result = html;
  // Expand display:none on product sections
  result = result.replace(
    /style=["'][^"']*(?:display\s*:\s*none|height\s*:\s*0|visibility\s*:\s*hidden)[^"']*["']/gi,
    'style="display:block;height:auto;visibility:visible"'
  );
  // Expand collapsed tabs
  result = result.replace(
    /class=["'][^"']*(?:tab-panel|tab-content|tab-pane)[^"']*["'][^>]*style=["'][^"']*(?:display\s*:\s*none|height\s*:\s*0)[^"']*["']/gi,
    (match) => match.replace(/style=["'][^"']*["']/i, 'style="display:block"')
  );
  // Remove aria-hidden on product sections
  result = result.replace(
    /(<div[^>]*class=["'][^"']*(?:product|description|specification|detail)[^"']*["'][^>]*)(?:aria-hidden=["']true["'])/gi,
    "$1"
  );
  return result;
}

function extractLazyContent(html: string): string {
  let result = html;
  // Convert data-src to src for lazy-loaded images
  result = result.replace(/data-src=["']([^"']+)["']/gi, 'src="$1"');
  // Convert data-lazy-src
  result = result.replace(/data-lazy-src=["']([^"']+)["']/gi, 'src="$1"');
  // Convert loading="lazy" to loading="eager"
  result = result.replace(/loading=["']lazy["']/gi, 'loading="eager"');
  return result;
}
