/**
 * ============================================================================
 * ProjectIdentity — the single source of truth for project identity.
 *
 * SEPARATION RULE:
 *   sourceUrl / sourceDomain = the website being analyzed (READ-ONLY, research)
 *   productDomain / productSlug = the customer-owned deployment (DEPLOYED, SERVED)
 *
 * CONSTRUCTION: Exactly once, at the CLI entry point.
 * CONSUMPTION:  Every downstream component via DeploymentContext.identity.
 *
 * NEVER derive deployment folders from source URL.
 * NEVER overwrite product identity with manifest source identity.
 * ============================================================================
 */

/**
 * Strict identity contract — separates source from product.
 */
export interface ProjectIdentity {

  /** The website being analyzed/cloned. Never deployed. Research-only. */
  sourceUrl: string;

  /** hostname extracted from sourceUrl, e.g. "www.solidhydrogen.tech" */
  sourceDomain: string;

  /** The customer-owned deployment domain. This is what gets deployed. */
  productDomain: string;

  /** Dots-to-hyphens normalization of productDomain. Used for folder names, Vercel project names. */
  productSlug: string;

}

/**
 * Derive sourceDomain from a URL string.
 * Throws if the URL is malformed.
 */
function extractSourceDomain(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).hostname;
  } catch {
    throw new Error(`Invalid sourceUrl: "${sourceUrl}" — must be a valid URL`);
  }
}

/**
 * Normalize a domain into a slug: dots → hyphens.
 * "websitefactorytest.online" → "websitefactorytest-online"
 */
function normalizeProductSlug(productDomain: string): string {
  return productDomain.replace(/\./g, "-");
}

/**
 * Construct a ProjectIdentity from the two required inputs.
 *
 * @param sourceUrl    — the target website URL (e.g. "https://www.solidhydrogen.tech")
 * @param productDomain — the deployment domain (e.g. "websitefactorytest.online")
 */
export function createProjectIdentity(
  sourceUrl: string,
  productDomain: string,
): ProjectIdentity {

  // Validate sourceUrl
  if (!sourceUrl || sourceUrl.trim().length === 0) {
    throw new Error("sourceUrl is required");
  }
  const trimmedUrl = sourceUrl.trim();

  // Validate and normalize productDomain
  if (!productDomain || productDomain.trim().length === 0) {
    throw new Error("productDomain is required");
  }
  const normalizedDomain = productDomain.trim().toLowerCase();

  // Basic domain validation: must contain at least one dot
  if (!normalizedDomain.includes(".")) {
    throw new Error(`Invalid productDomain: "${productDomain}" — must be a valid domain`);
  }

  const sourceDomain = extractSourceDomain(trimmedUrl);
  const productSlug = normalizeProductSlug(normalizedDomain);

  return {
    sourceUrl: trimmedUrl,
    sourceDomain,
    productDomain: normalizedDomain,
    productSlug,
  };

}
