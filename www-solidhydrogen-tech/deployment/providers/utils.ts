import type { ProviderResult, ProviderName } from "./types";
import { getContext } from "../context";

export function successResult<T>(provider: ProviderName, action: string, data: T, duration: number): ProviderResult<T> {
  return { success: true, data, provider, action, duration };
}

export function errorResult<T = void>(provider: ProviderName, action: string, errorMsg: string, duration: number): ProviderResult<T> {
  return { success: false, error: errorMsg, provider, action, duration };
}

export async function timed<T>(provider: ProviderName, action: string, fn: () => Promise<T>): Promise<ProviderResult<T>> {
  const start = Date.now();
  try {
    const data = await fn();
    return successResult(provider, action, data, Date.now() - start);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResult(provider, action, message, Date.now() - start);
  }
}

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

export async function retry<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < opts.maxAttempts) {
        const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function validateDomain(domain: string): boolean {
  const pattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return pattern.test(domain);
}

export function validateRepoName(name: string): boolean {
  const pattern = /^[a-zA-Z0-9._-]+$/;
  return pattern.test(name) && name.length <= 100;
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getGitHubToken(): string {
  return getContext().githubToken;
}

export function getVercelToken(): string {
  return getContext().vercelToken;
}

export function getCloudflareToken(): string {
  return getContext().cloudflareToken;
}

export function buildRepoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
