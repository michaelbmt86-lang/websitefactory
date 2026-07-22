// ============================================================================
// FIRECRAWL EXTRACTION ENGINE — Recovery Level 2
//
// Final recovery extraction. Complex HTML parsing, fallback content
// extraction, static page recovery. Used only when both Chrome DevTools MCP
// and JCodesMore fail. Must NEVER become the primary extraction engine.
// ============================================================================

import type { ExtractionEngineResult } from "@/types/discovery";

export async function fetchWithFirecrawl(url: string, timeoutMs: number): Promise<ExtractionEngineResult> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (apiKey) {
      return await fetchViaFirecrawlApi(url, apiKey, timeoutMs, startTime);
    }

    return await fetchViaFallbackParser(url, timeoutMs, startTime);
  } catch (err) {
    return {
      success: false,
      engine: "firecrawl",
      html: null,
      title: null,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : "Firecrawl extraction failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Firecrawl API integration
// ---------------------------------------------------------------------------
async function fetchViaFirecrawlApi(
  url: string,
  apiKey: string,
  timeoutMs: number,
  startTime: number,
): Promise<ExtractionEngineResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["html"],
        waitFor: 3000,
        timeout: timeoutMs,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return await fetchViaFallbackParser(url, timeoutMs, startTime);
    }

    const data = await response.json() as { data?: { html?: string; markdown?: string } };
    const html = data?.data?.html;

    if (!html || html.trim().length === 0) {
      return {
        success: false,
        engine: "firecrawl",
        html: null,
        title: null,
        durationMs: Date.now() - startTime,
        error: "Firecrawl returned empty content",
      };
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]+>/g, "") : null;

    // Return raw HTML — Extraction Manager handles validation
    return {
      success: true,
      engine: "firecrawl",
      html,
      title,
      durationMs: Date.now() - startTime,
    };
  } catch {
    clearTimeout(timer);
    return await fetchViaFallbackParser(url, timeoutMs, startTime);
  }
}

// ---------------------------------------------------------------------------
// Fallback: aggressive HTTP fetch + comprehensive HTML parser
// ---------------------------------------------------------------------------
async function fetchViaFallbackParser(
  url: string,
  timeoutMs: number,
  startTime: number,
): Promise<ExtractionEngineResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const userAgents = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    ];

    let html = "";
    let lastError = "";

    for (const ua of userAgents) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
          },
          signal: controller.signal,
          redirect: "follow",
        });

        if (response.ok) {
          html = await response.text();
          if (html && html.trim().length > 100) break;
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Fetch failed";
      }
    }

    clearTimeout(timer);

    if (!html || html.trim().length === 0) {
      return {
        success: false,
        engine: "firecrawl",
        html: null,
        title: null,
        durationMs: Date.now() - startTime,
        error: lastError || "All user agents failed",
      };
    }

    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      html += match[1];
    }

    const noscriptMatches = html.matchAll(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi);
    for (const match of noscriptMatches) {
      html += match[1];
    }

    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch
      ? titleMatch[1].trim().replace(/<[^>]+>/g, "")
      : ogTitle
        ? ogTitle[1]
        : null;

    // Return raw HTML — Extraction Manager handles validation
    return {
      success: true,
      engine: "firecrawl",
      html,
      title,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      success: false,
      engine: "firecrawl",
      html: null,
      title: null,
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : "Fallback parser failed",
    };
  }
}
