// ============================================================================
// ANALYZER INPUT BUILDER
//
// Single source of truth for constructing GeminiInput from DOM extraction
// results. All analyzer callers MUST use this builder to guarantee identical
// input structure regardless of extraction path.
// ============================================================================

import type {
  ProductSchema,
  ProductSpecification,
  ProductFAQ,
  ProductPageStructure,
  NetworkCapturedData,
} from "@/types/discovery";
import type { GeminiInput } from "./gemini-analyzer";

export interface AnalyzerInputSource {
  url: string;
  html: string;
  schema: ProductSchema[];
  networkData: NetworkCapturedData;
  specifications: ProductSpecification[];
  faq: ProductFAQ[];
  pageStructure: ProductPageStructure;
}

export function buildAnalyzerInput(source: AnalyzerInputSource): GeminiInput {
  return {
    url: source.url,
    html: source.html,
    structuredData: source.schema.map(s => s.data),
    networkData: source.networkData.jsonApiResponses,
    existingSpecs: source.specifications,
    existingFAQ: source.faq,
    existingStructure: source.pageStructure,
  };
}
