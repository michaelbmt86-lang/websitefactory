// ============================================================================
// ANALYZER ENGINE
//
// Dispatcher that obtains the active adapter from the provider registry
// and executes analyze(). Default provider is "regex".
// ============================================================================

import type { GeminiInput, GeminiOutput } from "./gemini-analyzer";
import { analyzerRegistry } from "./analyzer-provider-registry";
import { regexAnalyzerAdapter } from "./adapters/regex-analyzer";
import { geminiAnalyzerAdapter } from "./adapters/gemini-analyzer";
import { getAnalyzerProvider } from "./analyzer-config";

const DEFAULT_PROVIDER = "regex";

analyzerRegistry.registerAdapter(regexAnalyzerAdapter);
analyzerRegistry.registerAdapter(geminiAnalyzerAdapter);

let activeProviderName = getAnalyzerProvider();

export function getActiveProviderName(): string {
  return activeProviderName;
}

export function setActiveProvider(name: string): void {
  activeProviderName = name;
}

export async function analyze(input: GeminiInput): Promise<GeminiOutput> {
  const adapter = analyzerRegistry.getAdapter(activeProviderName)
    ?? analyzerRegistry.getAdapter(DEFAULT_PROVIDER);

  if (!adapter) {
    throw new Error(`No analyzer adapter found for "${activeProviderName}" and no default available`);
  }

  return adapter.analyze(input);
}
