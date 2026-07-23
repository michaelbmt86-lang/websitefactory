// ============================================================================
// VALIDATOR CONFIG
//
// Configurable thresholds for acquisition validation.
// Future plugins can extend these rules without changing architecture.
// ============================================================================

import type { ValidatorConfig } from "@/types/discovery";
import { ALL_ANTI_BOT_PATTERNS } from "./anti-bot-patterns";

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

export const DEFAULT_VALIDATOR_CONFIG: ValidatorConfig = {
  // Content thresholds
  minimumHtmlSize: 500,
  minimumBodyCharacters: 200,
  minimumInternalLinks: 1,
  minimumNavigationElements: 1,
  minimumImages: 0,

  // Score threshold (0-100)
  minimumScore: 70,

  // CAPTCHA keywords (case-insensitive)
  captchaKeywords: [
    "captcha",
    "验证码",
    "验证码拦截",
    "请完成安全验证",
    "recaptcha",
    "hcaptcha",
    "turnstile",
  ],

  // Anti-bot patterns (extensible)
  antiBotPatterns: ALL_ANTI_BOT_PATTERNS,

  // Product identity validation — reject obvious false pages only
  domainTitlePattern: /^(www\.)?[\w-]+\.[\w.]+\/?$/i,
  homepageTitlePatterns: [
    /^[\w\s]+(?:Home|Homepage|Welcome|Forside|Forsida)$/i,
    /^(Home|Homepage|Welcome|Forside|Forsida)$/i,
  ],
};

// ---------------------------------------------------------------------------
// Score weights (total = 100)
// ---------------------------------------------------------------------------

export const SCORE_WEIGHTS = {
  htmlExists: 10,
  htmlSize: 10,
  bodyLength: 15,
  navigation: 15,
  internalLinks: 10,
  seo: 10,
  schema: 10,
  media: 10,
  productIdentity: 15,
  antiBotDetection: 20,
} as const;

// ---------------------------------------------------------------------------
// Helper: Create custom config
// ---------------------------------------------------------------------------

export function createValidatorConfig(
  overrides: Partial<ValidatorConfig>
): ValidatorConfig {
  return {
    ...DEFAULT_VALIDATOR_CONFIG,
    ...overrides,
    antiBotPatterns: overrides.antiBotPatterns ?? DEFAULT_VALIDATOR_CONFIG.antiBotPatterns,
    homepageTitlePatterns: overrides.homepageTitlePatterns ?? DEFAULT_VALIDATOR_CONFIG.homepageTitlePatterns,
  };
}
