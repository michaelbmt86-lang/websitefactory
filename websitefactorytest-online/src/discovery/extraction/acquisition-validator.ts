// ============================================================================
// ACQUISITION VALIDATOR
//
// Pure validation plugin. Evaluates acquisition quality.
// No external calls. No crawling. No API calls.
// Input: HTML, Metadata, Engine Name
// Output: ValidationResult (status, score, reason, checks)
// ============================================================================

import type {
  ExtractionEngineName,
  ValidationCheck,
  ValidationResult,
  ValidatorConfig,
  AntiBotPattern,
} from "@/types/discovery";
import { DEFAULT_VALIDATOR_CONFIG, SCORE_WEIGHTS } from "./validator-config";

// ---------------------------------------------------------------------------
// Main validation function
// ---------------------------------------------------------------------------

export function validateAcquisition(
  html: string,
  title: string | null,
  engine: ExtractionEngineName,
  config: ValidatorConfig = DEFAULT_VALIDATOR_CONFIG
): ValidationResult {
  const checks: ValidationCheck[] = [];
  let totalScore = 0;

  // 1. HTML Exists (10 points)
  const htmlCheck = checkHtmlExists(html);
  checks.push(htmlCheck);
  totalScore += htmlCheck.score;

  // 2. HTML Size (10 points)
  const sizeCheck = checkHtmlSize(html, config.minimumHtmlSize);
  checks.push(sizeCheck);
  totalScore += sizeCheck.score;

  // 3. Body Length (15 points)
  const bodyCheck = checkBodyLength(html, config.minimumBodyCharacters);
  checks.push(bodyCheck);
  totalScore += bodyCheck.score;

  // 4. Navigation (15 points)
  const navCheck = checkNavigation(html, config.minimumNavigationElements);
  checks.push(navCheck);
  totalScore += navCheck.score;

  // 5. Internal Links (10 points)
  const linksCheck = checkInternalLinks(html, config.minimumInternalLinks);
  checks.push(linksCheck);
  totalScore += linksCheck.score;

  // 6. SEO Metadata (10 points)
  const seoCheck = checkSeoMetadata(html, title);
  checks.push(seoCheck);
  totalScore += seoCheck.score;

  // 7. Schema Presence (10 points)
  const schemaCheck = checkSchemaPresence(html);
  checks.push(schemaCheck);
  totalScore += schemaCheck.score;

  // 8. Media Detection (10 points)
  const mediaCheck = checkMediaPresence(html, config.minimumImages);
  checks.push(mediaCheck);
  totalScore += mediaCheck.score;

  // 9. Anti-Bot Detection (20 points)
  const antiBotCheck = checkAntiBotPatterns(html, config);
  checks.push(antiBotCheck);
  totalScore += antiBotCheck.score;

  // Determine status
  const status = totalScore >= config.minimumScore ? "PASS" : "FAIL";

  // Generate reason
  const reason = generateReason(checks, status, totalScore);

  return {
    status,
    score: totalScore,
    reason,
    engine,
    checks,
  };
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkHtmlExists(html: string): ValidationCheck {
  const passed = html !== null && html !== undefined && html.trim().length > 0;
  return {
    name: "html-exists",
    passed,
    message: passed ? "HTML content exists" : "HTML content is empty or null",
    severity: "error",
    weight: SCORE_WEIGHTS.htmlExists,
    score: passed ? SCORE_WEIGHTS.htmlExists : 0,
  };
}

function checkHtmlSize(html: string, minimumSize: number): ValidationCheck {
  const size = html.length;
  const passed = size >= minimumSize;
  return {
    name: "html-size",
    passed,
    message: passed
      ? `HTML size ${size} bytes >= ${minimumSize} bytes`
      : `HTML size ${size} bytes < ${minimumSize} bytes`,
    severity: "error",
    weight: SCORE_WEIGHTS.htmlSize,
    score: passed ? SCORE_WEIGHTS.htmlSize : 0,
  };
}

function checkBodyLength(html: string, minimumLength: number): ValidationCheck {
  const textContent = stripTags(html).trim();
  const length = textContent.length;
  const passed = length >= minimumLength;
  return {
    name: "body-length",
    passed,
    message: passed
      ? `Body text ${length} chars >= ${minimumLength} chars`
      : `Body text ${length} chars < ${minimumLength} chars`,
    severity: "error",
    weight: SCORE_WEIGHTS.bodyLength,
    score: passed ? SCORE_WEIGHTS.bodyLength : 0,
  };
}

function checkNavigation(html: string, minimumElements: number): ValidationCheck {
  const headerMatch = html.match(/<header[^>]*>/i);
  const navMatch = html.match(/<nav[^>]*>/i);
  const count = (headerMatch ? 1 : 0) + (navMatch ? 1 : 0);
  const passed = count >= minimumElements;
  return {
    name: "navigation",
    passed,
    message: passed
      ? `Navigation elements ${count} >= ${minimumElements}`
      : `Navigation elements ${count} < ${minimumElements}`,
    severity: "warning",
    weight: SCORE_WEIGHTS.navigation,
    score: passed ? SCORE_WEIGHTS.navigation : 0,
  };
}

function checkInternalLinks(html: string, minimumLinks: number): ValidationCheck {
  const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
  let internalCount = 0;
  for (const match of linkMatches) {
    const href = match[1];
    if (href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:") && !href.startsWith("javascript:") && !href.startsWith("http")) {
      internalCount++;
    }
  }
  const passed = internalCount >= minimumLinks;
  return {
    name: "internal-links",
    passed,
    message: passed
      ? `Internal links ${internalCount} >= ${minimumLinks}`
      : `Internal links ${internalCount} < ${minimumLinks}`,
    severity: "warning",
    weight: SCORE_WEIGHTS.internalLinks,
    score: passed ? SCORE_WEIGHTS.internalLinks : 0,
  };
}

function checkSeoMetadata(html: string, title: string | null): ValidationCheck {
  const hasTitle = title !== null && title.trim().length > 0 && !isCaptchaTitle(title);
  const hasMetaDescription = /<meta[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html);
  const hasOgTitle = /<meta[^>]*property=["']og:title["'][^>]*content=["'][^"']+["']/i.test(html);
  const score = (hasTitle ? 5 : 0) + (hasMetaDescription ? 3 : 0) + (hasOgTitle ? 2 : 0);
  const passed = score >= 5;
  return {
    name: "seo-metadata",
    passed,
    message: passed
      ? `SEO metadata present (title: ${hasTitle}, description: ${hasMetaDescription}, og:title: ${hasOgTitle})`
      : `SEO metadata insufficient (title: ${hasTitle}, description: ${hasMetaDescription}, og:title: ${hasOgTitle})`,
    severity: "warning",
    weight: SCORE_WEIGHTS.seo,
    score,
  };
}

function checkSchemaPresence(html: string): ValidationCheck {
  const hasSchema = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html);
  return {
    name: "schema-presence",
    passed: hasSchema,
    message: hasSchema
      ? "JSON-LD schema detected"
      : "No JSON-LD schema found",
    severity: "warning",
    weight: SCORE_WEIGHTS.schema,
    score: hasSchema ? SCORE_WEIGHTS.schema : 0,
  };
}

function checkMediaPresence(html: string, minimumImages: number): ValidationCheck {
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  let imageCount = 0;
  for (const match of imgMatches) {
    if (match[1] && !match[1].startsWith("data:")) {
      imageCount++;
    }
  }
  const passed = imageCount >= minimumImages;
  return {
    name: "media-presence",
    passed,
    message: passed
      ? `Images ${imageCount} >= ${minimumImages}`
      : `Images ${imageCount} < ${minimumImages}`,
    severity: "warning",
    weight: SCORE_WEIGHTS.media,
    score: passed ? SCORE_WEIGHTS.media : 0,
  };
}

function checkAntiBotPatterns(html: string, config: ValidatorConfig): ValidationCheck {
  const matchedPatterns: AntiBotPattern[] = [];

  for (const pattern of config.antiBotPatterns) {
    if (pattern.pattern.test(html)) {
      matchedPatterns.push(pattern);
    }
  }

  if (matchedPatterns.length === 0) {
    return {
      name: "anti-bot-detection",
      passed: true,
      message: "No anti-bot patterns detected",
      severity: "error",
      weight: SCORE_WEIGHTS.antiBotDetection,
      score: SCORE_WEIGHTS.antiBotDetection,
    };
  }

  // Calculate penalty based on matched patterns
  const maxWeight = Math.max(...matchedPatterns.map((p) => p.weight));
  const hasErrorSeverity = matchedPatterns.some((p) => p.severity === "error");
  const penalty = hasErrorSeverity ? maxWeight : Math.min(maxWeight, 10);
  const score = Math.max(0, SCORE_WEIGHTS.antiBotDetection - penalty);

  const patternNames = matchedPatterns.map((p) => p.name).join(", ");
  return {
    name: "anti-bot-detection",
    passed: false,
    message: `Anti-bot patterns detected: ${patternNames}`,
    severity: "error",
    weight: SCORE_WEIGHTS.antiBotDetection,
    score,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCaptchaTitle(title: string): boolean {
  const captchaKeywords = ["captcha", "验证码", "验证码拦截", "请完成安全验证", "challenge", "verification"];
  const lower = title.toLowerCase();
  return captchaKeywords.some((kw) => lower.includes(kw));
}

function generateReason(
  checks: ValidationCheck[],
  status: "PASS" | "FAIL",
  score: number
): string {
  if (status === "PASS") {
    return `Validation passed with score ${score}/100`;
  }

  const failedChecks = checks.filter((c) => !c.passed);
  const criticalFailures = failedChecks.filter((c) => c.severity === "error");

  if (criticalFailures.length > 0) {
    return `Validation failed: ${criticalFailures.map((c) => c.message).join("; ")}`;
  }

  return `Validation failed with score ${score}/100 (threshold: 50)`;
}
