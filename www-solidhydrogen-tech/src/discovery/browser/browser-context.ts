// ============================================================================
// BROWSER CONTEXT
//
// Defines browser context types and interfaces for the Layer 4 Browser
// Extraction Layer. This module provides type definitions for browser
// execution context, engine context, and extraction context only.
// ============================================================================

import type { ExtractionEngineName, ExtractionEngineResult } from "@/types/discovery";
import type { BrowserSession } from "./browser-session";
import type { BrowserHealthState } from "./browser-health";

// ---------------------------------------------------------------------------
// Browser Engine Context
// ---------------------------------------------------------------------------

export interface BrowserEngineContext {
  engine: ExtractionEngineName;
  displayName: string;
  priority: number;
  role: "primary" | "recovery-l1" | "recovery-l2";
  timeoutMs: number;
  retryLimit: number;
  healthState: BrowserHealthState;
  capabilities: string[];
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Browser Execution Context
// ---------------------------------------------------------------------------

export interface BrowserExtractionContext {
  url: string;
  engine: ExtractionEngineName;
  session: BrowserSession;
  engineContext: BrowserEngineContext;
  startTime: string;
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
}

// ---------------------------------------------------------------------------
// Browser Capture Context
// ---------------------------------------------------------------------------

export interface BrowserCaptureContext {
  session: BrowserSession;
  url: string;
  engine: ExtractionEngineName;
  navigationDurationMs: number;
  responseCode: number | null;
  contentLength: number;
  title: string | null;
}

// ---------------------------------------------------------------------------
// Browser Recovery Context
// ---------------------------------------------------------------------------

export interface BrowserRecoveryContext {
  failedEngine: ExtractionEngineName;
  failureType: "navigation" | "capture" | "session" | "timeout" | "memory";
  failureCategory: "network" | "timeout" | "parsing" | "session" | "unknown";
  error: string;
  sessionId: string;
  url: string;
  recoverable: boolean;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Browser Result Context
// ---------------------------------------------------------------------------

export interface BrowserResultContext {
  engine: ExtractionEngineName;
  result: ExtractionEngineResult;
  sessionId: string;
  navigationDurationMs: number;
  captureDurationMs: number;
  contentLength: number;
  assetCount: number;
  validationPassed: boolean;
  validationIssues: string[];
}

// ---------------------------------------------------------------------------
// Engine Context Definitions
// ---------------------------------------------------------------------------

export const ENGINE_CONTEXTS: Record<ExtractionEngineName, BrowserEngineContext> = {
  "chrome-devtools-mcp": {
    engine: "chrome-devtools-mcp",
    displayName: "Chrome DevTools MCP",
    priority: 1,
    role: "primary",
    timeoutMs: 60000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["full-dom", "javascript-execution", "network-interception", "screenshots", "lazy-load-triggering"],
    limitations: ["requires-mcp-server", "browser-dependent"],
  },
  "jcodesmore-browser": {
    engine: "jcodesmore-browser",
    displayName: "JCodesMore Browser",
    priority: 2,
    role: "recovery-l1",
    timeoutMs: 30000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["http-fetch", "browser-headers", "lazy-load-simulation", "content-expansion"],
    limitations: ["no-javascript-execution", "no-network-interception"],
  },
  "firecrawl": {
    engine: "firecrawl",
    displayName: "Firecrawl Recovery Engine",
    priority: 3,
    role: "recovery-l2",
    timeoutMs: 45000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["managed-scraping", "api-access", "fallback-parser", "rate-limiting"],
    limitations: ["api-dependency", "cost-per-request", "rate-limited"],
  },
};
