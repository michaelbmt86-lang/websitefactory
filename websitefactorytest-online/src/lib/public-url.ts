import fs from "fs";
import path from "path";

interface DomainConfig {
  product_domain?: string;
  target_domain?: string;
  domain?: string;
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function readDomainConfig(): DomainConfig | null {
  try {
    const configPath = path.join(process.cwd(), "deployment", "domain.config.json");
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, "utf-8")) as DomainConfig;
  } catch {
    return null;
  }
}

export function getProductDomain(): string {
  const config = readDomainConfig();
  const candidates = [
    process.env.DOMAIN,
    process.env.NEXT_PUBLIC_SITE_DOMAIN,
    config?.product_domain,
    config?.target_domain,
    config?.domain,
  ];

  const domain = candidates.find((value): value is string => !!value && value.trim().length > 0);
  if (!domain) {
    throw new Error(
      "No product domain configured. Set DOMAIN or NEXT_PUBLIC_SITE_DOMAIN env var, " +
      "or provide product_domain in deployment/domain.config.json."
    );
  }
  return normalizeDomain(domain);
}

export function getPublicBaseUrl(): string {
  return `https://${getProductDomain()}`;
}

export function toProductUrl(inputUrl: string, productDomain: string): string {
  const baseUrl = `https://${normalizeDomain(productDomain)}`;

  try {
    const url = new URL(inputUrl);
    return `${baseUrl}${url.pathname}${url.search}${url.hash}`;
  } catch {
    const pathOnly = inputUrl.startsWith("/") ? inputUrl : `/${inputUrl}`;
    return `${baseUrl}${pathOnly}`;
  }
}
