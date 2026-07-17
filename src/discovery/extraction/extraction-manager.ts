// ============================================================================
// EXTRACTION MANAGER
//
// Coordinates all extraction engines with automatic fallback recovery.
// Priority: Chrome DevTools MCP → JCodesMore Browser → Firecrawl
// Never skips engine priority. Never promotes Firecrawl to primary.
// First successful extraction terminates the recovery chain.
// ============================================================================

import db from "@/lib/db";
import type {
  ExtractionEngineName,
  ExtractionEngineResult,
  ExtractionMetrics,
} from "@/types/discovery";
import { fetchText } from "../sitemap-parser";
import { fetchWithJCodesMore } from "./jcodesmore-engine";
import { fetchWithFirecrawl } from "./firecrawl-engine";

export interface ExtractionManagerOptions {
  maxRetriesPerEngine?: number;
  timeoutMs?: number;
}

interface EngineConfig {
  name: ExtractionEngineName;
  fetchFn: (url: string, timeoutMs: number) => Promise<ExtractionEngineResult>;
  maxRetries: number;
}

const DEFAULT_OPTIONS: ExtractionManagerOptions = {
  maxRetriesPerEngine: 2,
  timeoutMs: 30000,
};

// ---------------------------------------------------------------------------
// Chrome DevTools MCP — Primary engine
// Uses the existing fetchText (HTTP fetch) for DOM extraction.
// ---------------------------------------------------------------------------
async function fetchWithChromeDevTools(url: string, timeoutMs: number): Promise<ExtractionEngineResult> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const html = await fetchText(url);
    clearTimeout(timer);
    if (!html || html.trim().length === 0) {
      return { success: false, engine: "chrome-devtools-mcp", html: null, title: null, durationMs: Date.now() - startTime, error: "Empty HTML response" };
    }
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]+>/g, "") : null;
    return { success: true, engine: "chrome-devtools-mcp", html, title, durationMs: Date.now() - startTime };
  } catch (err) {
    return { success: false, engine: "chrome-devtools-mcp", html: null, title: null, durationMs: Date.now() - startTime, error: err instanceof Error ? err.message : "Chrome DevTools extraction failed" };
  }
}

// ---------------------------------------------------------------------------
// Engine registry — priority order, never changes
// ---------------------------------------------------------------------------
function getEngineConfigs(options: ExtractionManagerOptions): EngineConfig[] {
  const maxRetries = options.maxRetriesPerEngine ?? 2;
  return [
    { name: "chrome-devtools-mcp", fetchFn: fetchWithChromeDevTools, maxRetries },
    { name: "jcodesmore-browser", fetchFn: fetchWithJCodesMore, maxRetries },
    { name: "firecrawl", fetchFn: fetchWithFirecrawl, maxRetries },
  ];
}

// ---------------------------------------------------------------------------
// Extract with automatic fallback recovery
// ---------------------------------------------------------------------------
export async function extractWithRecovery(
  url: string,
  options: ExtractionManagerOptions = DEFAULT_OPTIONS,
): Promise<ExtractionEngineResult> {
  const engines = getEngineConfigs(options);
  const startTime = Date.now();
  let totalAttempts = 0;
  let lastError = "";

  for (const engine of engines) {
    for (let attempt = 1; attempt <= engine.maxRetries; attempt++) {
      totalAttempts++;
      const result = await engine.fetchFn(url, options.timeoutMs ?? 30000);

      if (result.success) {
        // Record success metric
        recordMetric(url, engine.name, engine.name, totalAttempts, Date.now() - startTime, null, "success");
        return result;
      }

      lastError = result.error || `${engine.name} failed`;
      // Brief delay before retry within same engine
      if (attempt < engine.maxRetries) {
        await delay(500 * attempt);
      }
    }
    // Engine exhausted — record failure for this engine
    recordMetric(url, engines[0].name, null, totalAttempts, Date.now() - startTime, lastError, "engine-failed");
  }

  // All engines exhausted
  recordMetric(url, engines[0].name, null, totalAttempts, Date.now() - startTime, lastError, "failed");
  return {
    success: false,
    engine: "chrome-devtools-mcp",
    html: null,
    title: null,
    durationMs: Date.now() - startTime,
    error: `All engines failed after ${totalAttempts} attempts: ${lastError}`,
  };
}

// ---------------------------------------------------------------------------
// Get extraction metrics
// ---------------------------------------------------------------------------
export function getExtractionMetrics(url?: string): ExtractionMetrics[] {
  if (url) {
    return db.prepare("SELECT * FROM extraction_metrics WHERE url = ? ORDER BY created_at DESC").all(url) as ExtractionMetrics[];
  }
  return db.prepare("SELECT * FROM extraction_metrics ORDER BY created_at DESC").all() as ExtractionMetrics[];
}

export function getExtractionMetricsSummary(): {
  totalUrls: number;
  primarySuccessCount: number;
  recoveryL1Count: number;
  recoveryL2Count: number;
  failedCount: number;
  averageAttempts: number;
  averageDurationMs: number;
  successRate: number;
} {
  const all = db.prepare("SELECT * FROM extraction_metrics").all() as ExtractionMetrics[];
  const totalUrls = all.length;
  const primarySuccessCount = all.filter(m => m.successful_engine === "chrome-devtools-mcp").length;
  const recoveryL1Count = all.filter(m => m.successful_engine === "jcodesmore-browser").length;
  const recoveryL2Count = all.filter(m => m.successful_engine === "firecrawl").length;
  const failedCount = all.filter(m => m.status === "failed").length;
  const averageAttempts = totalUrls > 0 ? Math.round(all.reduce((s, m) => s + m.attempts, 0) / totalUrls) : 0;
  const averageDurationMs = totalUrls > 0 ? Math.round(all.reduce((s, m) => s + m.duration_ms, 0) / totalUrls) : 0;
  const successRate = totalUrls > 0 ? Math.round(((totalUrls - failedCount) / totalUrls) * 100) : 0;

  return { totalUrls, primarySuccessCount, recoveryL1Count, recoveryL2Count, failedCount, averageAttempts, averageDurationMs, successRate };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function recordMetric(
  url: string,
  primaryEngine: string,
  successfulEngine: string | null,
  attempts: number,
  durationMs: number,
  failureReason: string | null,
  status: string,
): void {
  db.prepare(`
    INSERT INTO extraction_metrics (url, primary_engine, successful_engine, attempts, duration_ms, failure_reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(url, primaryEngine, successfulEngine, attempts, durationMs, failureReason, status);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
