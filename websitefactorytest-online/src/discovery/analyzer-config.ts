// ============================================================================
// ANALYZER CONFIGURATION
//
// Reads analyzer.config.json from project root. Returns the active provider
// name. Falls back to "regex" if config is missing or invalid.
// ============================================================================

import fs from "fs";
import path from "path";

const DEFAULT_PROVIDER = "regex";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

interface AnalyzerGeminiConfig {
  model?: string;
}

interface AnalyzerConfig {
  provider: string;
  gemini?: AnalyzerGeminiConfig;
}

function readConfig(): AnalyzerConfig | null {
  try {
    const configPath = path.join(process.cwd(), "analyzer.config.json");
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as AnalyzerConfig;
  } catch {
    return null;
  }
}

export function getAnalyzerProvider(): string {
  const config = readConfig();
  if (config && typeof config.provider === "string" && config.provider.length > 0) {
    return config.provider;
  }
  return DEFAULT_PROVIDER;
}

export function getGeminiModel(): string {
  const config = readConfig();
  if (config?.gemini && typeof config.gemini.model === "string" && config.gemini.model.length > 0) {
    return config.gemini.model;
  }
  return DEFAULT_GEMINI_MODEL;
}
