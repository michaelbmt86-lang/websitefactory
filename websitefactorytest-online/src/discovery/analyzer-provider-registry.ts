// ============================================================================
// ANALYZER PROVIDER REGISTRY
//
// Stores available AnalyzerAdapters by name. Provides register, retrieve,
// and list operations. No config system, no fallback chains, no health
// checks — minimal registry only.
// ============================================================================

import type { AnalyzerAdapter } from "./analyzer-adapter";

export class AnalyzerProviderRegistry {
  private adapters = new Map<string, AnalyzerAdapter>();

  registerAdapter(adapter: AnalyzerAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  getAdapter(name: string): AnalyzerAdapter | undefined {
    return this.adapters.get(name);
  }

  listAdapters(): AnalyzerAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const analyzerRegistry = new AnalyzerProviderRegistry();
