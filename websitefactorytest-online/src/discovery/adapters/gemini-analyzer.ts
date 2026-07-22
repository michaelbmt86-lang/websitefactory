// ============================================================================
// GEMINI ANALYZER ADAPTER
//
// Calls the Gemini API to analyze product page data and extract structured
// information. Falls back to the regex analyzer on any failure.
// Uses GEMINI_API_KEY from environment variables.
// ============================================================================

import type { AnalyzerAdapter } from "../analyzer-adapter";
import type { GeminiInput, GeminiOutput } from "../gemini-analyzer";
import { analyzeWithGemini } from "../gemini-analyzer";
import { getGeminiModel } from "../analyzer-config";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function buildPrompt(input: GeminiInput): string {
  const structuredDataStr = JSON.stringify(input.structuredData, null, 2).slice(0, 8000);
  const networkDataStr = JSON.stringify(input.networkData, null, 2).slice(0, 4000);
  const existingSpecsStr = JSON.stringify(input.existingSpecs, null, 2);
  const existingFaqStr = JSON.stringify(input.existingFAQ, null, 2);
  const existingStructureStr = JSON.stringify(input.existingStructure, null, 2);

  // Truncate HTML to fit within token limits — keep essential parts
  const htmlTruncated = input.html.length > 30000
    ? input.html.slice(0, 15000) + "\n... [TRUNCATED] ...\n" + input.html.slice(-15000)
    : input.html;

  return `You are a product data extraction engine. Analyze the following product page data and extract structured information.

URL: ${input.url}

HTML (truncated):
${htmlTruncated}

JSON-LD Structured Data:
${structuredDataStr}

Network API Responses:
${networkDataStr}

Existing Extracted Specs:
${existingSpecsStr}

Existing FAQ:
${existingFaqStr}

Existing Page Structure:
${existingStructureStr}

Extract and normalize the product information. Return ONLY a valid JSON object matching this exact schema (no markdown, no code fences):

{
  "title": "string - product title",
  "subtitle": "string - short subtitle or tagline",
  "description": "string - full product description",
  "shortDescription": "string - brief 1-2 sentence description",
  "brand": "string - brand name",
  "model": "string - model number/name",
  "sku": "string - SKU identifier",
  "category": "string - product category",
  "subcategory": "string - product subcategory",
  "specifications": [{"name": "string", "value": "string", "group": "string"}],
  "faq": [{"question": "string", "answer": "string"}],
  "relatedProducts": [{"url": "string", "name": "string", "imageUrl": "string|null", "price": "string|null", "relationship": "related|cross-sell|up-sell"}],
  "tags": ["string"],
  "collection": "string - product collection/line",
  "breadcrumbs": [{"label": "string", "href": "string|null"}]
}

Rules:
- Use existing extracted data as a base, enhance with HTML analysis
- If a field cannot be determined, use an empty string "" or empty array []
- Maintain existing specifications but add new ones found in the HTML
- Extract all product specifications with their groups
- Return ONLY the JSON object, nothing else`;
}

function validateOutput(data: unknown): data is GeminiOutput {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  const requiredStrings = ["title", "subtitle", "description", "shortDescription", "brand", "model", "sku", "category", "subcategory", "collection"];
  for (const key of requiredStrings) {
    if (typeof obj[key] !== "string") return false;
  }

  if (!Array.isArray(obj.specifications)) return false;
  if (!Array.isArray(obj.faq)) return false;
  if (!Array.isArray(obj.relatedProducts)) return false;
  if (!Array.isArray(obj.tags)) return false;
  if (!Array.isArray(obj.breadcrumbs)) return false;

  return true;
}

function sanitizeOutput(data: Record<string, unknown>): GeminiOutput {
  return {
    title: String(data.title || ""),
    subtitle: String(data.subtitle || ""),
    description: String(data.description || ""),
    shortDescription: String(data.shortDescription || ""),
    brand: String(data.brand || ""),
    model: String(data.model || ""),
    sku: String(data.sku || ""),
    category: String(data.category || ""),
    subcategory: String(data.subcategory || ""),
    specifications: Array.isArray(data.specifications) ? data.specifications as GeminiOutput["specifications"] : [],
    faq: Array.isArray(data.faq) ? data.faq as GeminiOutput["faq"] : [],
    relatedProducts: Array.isArray(data.relatedProducts) ? data.relatedProducts as GeminiOutput["relatedProducts"] : [],
    tags: Array.isArray(data.tags) ? data.tags as string[] : [],
    collection: String(data.collection || ""),
    breadcrumbs: Array.isArray(data.breadcrumbs) ? data.breadcrumbs as GeminiOutput["breadcrumbs"] : [],
  };
}

async function callGeminiApi(prompt: string, apiKey: string): Promise<string> {
  const model = getGeminiModel();
  const url = `${GEMINI_API_BASE}/${model}:generateContent`;
  const response = await fetch(`${url}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini API returned empty response");
  }

  return text;
}

function parseJsonResponse(text: string): unknown {
  // Try to extract JSON from the response (may be wrapped in markdown code fences)
  let jsonStr = text.trim();

  // Remove markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  return JSON.parse(jsonStr);
}

export const geminiAnalyzerAdapter: AnalyzerAdapter = {
  name: "gemini",

  async analyze(input: GeminiInput): Promise<GeminiOutput> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[gemini-analyzer] GEMINI_API_KEY not set, falling back to regex");
      return analyzeWithGemini(input);
    }

    try {
      const prompt = buildPrompt(input);
      const responseText = await callGeminiApi(prompt, apiKey);
      const parsed = parseJsonResponse(responseText);

      if (!validateOutput(parsed)) {
        console.warn("[gemini-analyzer] Invalid response structure, falling back to regex");
        return analyzeWithGemini(input);
      }

      return sanitizeOutput(parsed as unknown as Record<string, unknown>);
    } catch (err) {
      console.error("[gemini-analyzer] Gemini API failed, falling back to regex:", err);
      return analyzeWithGemini(input);
    }
  },
};
