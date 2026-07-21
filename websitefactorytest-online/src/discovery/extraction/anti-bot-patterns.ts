// ============================================================================
// ANTI-BOT PATTERN LIBRARY
//
// Extensible pattern library for detecting anti-bot mechanisms.
// Reusable across all acquisition engines.
// No external calls. Pure pattern matching.
// ============================================================================

import type { AntiBotPattern } from "@/types/discovery";

// ---------------------------------------------------------------------------
// Pattern Categories
// ---------------------------------------------------------------------------

const CAPTCHA_PATTERNS: AntiBotPattern[] = [
  {
    name: "generic-captcha",
    pattern: /captcha/gi,
    severity: "error",
    weight: 20,
    category: "captcha",
  },
  {
    name: "chinese-captcha-intercept",
    pattern: /验证码拦截/g,
    severity: "error",
    weight: 20,
    category: "captcha",
  },
  {
    name: "chinese-captcha",
    pattern: /验证码/g,
    severity: "error",
    weight: 20,
    category: "captcha",
  },
  {
    name: "chinese-security-verify",
    pattern: /请完成安全验证/g,
    severity: "error",
    weight: 20,
    category: "captcha",
  },
  {
    name: "recaptcha",
    pattern: /recaptcha/gi,
    severity: "error",
    weight: 20,
    category: "captcha",
  },
  {
    name: "hcaptcha",
    pattern: /hcaptcha/gi,
    severity: "error",
    weight: 20,
    category: "captcha",
  },
  {
    name: "turnstile",
    pattern: /turnstile/gi,
    severity: "warning",
    weight: 15,
    category: "captcha",
  },
];

const CHALLENGE_PATTERNS: AntiBotPattern[] = [
  {
    name: "cloudflare-challenge",
    pattern: /challenge-platform/gi,
    severity: "error",
    weight: 20,
    category: "challenge",
  },
  {
    name: "cloudflare-verification",
    pattern: /cf-browser-verification/gi,
    severity: "error",
    weight: 20,
    category: "challenge",
  },
  {
    name: "just-a-moment",
    pattern: /just a moment/gi,
    severity: "error",
    weight: 20,
    category: "challenge",
  },
  {
    name: "checking-your-browser",
    pattern: /checking your browser/gi,
    severity: "error",
    weight: 20,
    category: "challenge",
  },
  {
    name: "enable-javascript",
    pattern: /enable javascript/gi,
    severity: "warning",
    weight: 10,
    category: "challenge",
  },
  {
    name: "ddos-protection",
    pattern: /ddos protection/gi,
    severity: "error",
    weight: 20,
    category: "challenge",
  },
];

const ACCESS_DENIED_PATTERNS: AntiBotPattern[] = [
  {
    name: "access-denied",
    pattern: /access denied/gi,
    severity: "error",
    weight: 20,
    category: "access-denied",
  },
  {
    name: "forbidden",
    pattern: /forbidden/gi,
    severity: "error",
    weight: 20,
    category: "access-denied",
  },
  {
    name: "blocked",
    pattern: /blocked/gi,
    severity: "warning",
    weight: 15,
    category: "access-denied",
  },
  {
    name: "not-allowed",
    pattern: /not allowed/gi,
    severity: "error",
    weight: 20,
    category: "access-denied",
  },
];

const VERIFICATION_PATTERNS: AntiBotPattern[] = [
  {
    name: "robot-verification",
    pattern: /robot verification/gi,
    severity: "error",
    weight: 20,
    category: "verification",
  },
  {
    name: "verify-you-are-human",
    pattern: /verify you are human/gi,
    severity: "error",
    weight: 20,
    category: "verification",
  },
  {
    name: "verification-required",
    pattern: /verification required/gi,
    severity: "error",
    weight: 20,
    category: "verification",
  },
  {
    name: "human-verification",
    pattern: /human verification/gi,
    severity: "error",
    weight: 20,
    category: "verification",
  },
  {
    name: "security-check",
    pattern: /security check/gi,
    severity: "error",
    weight: 20,
    category: "verification",
  },
  {
    name: "chinese-safety-verify",
    pattern: /安全验证/g,
    severity: "error",
    weight: 20,
    category: "verification",
  },
];

const BOT_DETECTION_PATTERNS: AntiBotPattern[] = [
  {
    name: "perimeterx",
    pattern: /perimeterx/gi,
    severity: "error",
    weight: 20,
    category: "bot-detection",
  },
  {
    name: "datadome",
    pattern: /datadome/gi,
    severity: "error",
    weight: 20,
    category: "bot-detection",
  },
  {
    name: "akamai-bot",
    pattern: /akamai.*bot/gi,
    severity: "error",
    weight: 20,
    category: "bot-detection",
  },
  {
    name: "imperva",
    pattern: /imperva/gi,
    severity: "error",
    weight: 20,
    category: "bot-detection",
  },
  {
    name: "cloudflare-bot",
    pattern: /cloudflare.*bot/gi,
    severity: "error",
    weight: 20,
    category: "bot-detection",
  },
  {
    name: "anti-bot",
    pattern: /anti.?bot/gi,
    severity: "error",
    weight: 20,
    category: "bot-detection",
  },
  {
    name: "bot-detect",
    pattern: /bot.?detect/gi,
    severity: "error",
    weight: 20,
    category: "bot-detection",
  },
];

// ---------------------------------------------------------------------------
// Combined pattern library
// ---------------------------------------------------------------------------

export const ALL_ANTI_BOT_PATTERNS: AntiBotPattern[] = [
  ...CAPTCHA_PATTERNS,
  ...CHALLENGE_PATTERNS,
  ...ACCESS_DENIED_PATTERNS,
  ...VERIFICATION_PATTERNS,
  ...BOT_DETECTION_PATTERNS,
];

// ---------------------------------------------------------------------------
// Pattern categories for extensibility
// ---------------------------------------------------------------------------

export const PATTERN_CATEGORIES = {
  captcha: CAPTCHA_PATTERNS,
  challenge: CHALLENGE_PATTERNS,
  "access-denied": ACCESS_DENIED_PATTERNS,
  verification: VERIFICATION_PATTERNS,
  "bot-detection": BOT_DETECTION_PATTERNS,
} as const;

// ---------------------------------------------------------------------------
// Helper: Get patterns by category
// ---------------------------------------------------------------------------

export function getPatternsByCategory(
  category: AntiBotPattern["category"]
): AntiBotPattern[] {
  return ALL_ANTI_BOT_PATTERNS.filter((p) => p.category === category);
}

// ---------------------------------------------------------------------------
// Helper: Add custom pattern (for future extensibility)
// ---------------------------------------------------------------------------

export function createCustomPattern(
  name: string,
  regex: RegExp,
  category: AntiBotPattern["category"],
  severity: "error" | "warning" = "error",
  weight: number = 20
): AntiBotPattern {
  return {
    name,
    pattern: regex,
    severity,
    weight,
    category,
  };
}
