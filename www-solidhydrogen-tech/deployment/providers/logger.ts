import type { LogLevel, ProviderName, ProviderResult, ProviderOperationLog } from "./types";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, provider: ProviderName | string, action: string, message: string): string {
  return `[${formatTimestamp()}] [${level.toUpperCase()}] [${provider}] ${action}: ${message}`;
}

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function debug(provider: ProviderName | string, action: string, message: string): void {
  if (shouldLog("debug")) {
    console.debug(formatMessage("debug", provider, action, message));
  }
}

export function info(provider: ProviderName | string, action: string, message: string): void {
  if (shouldLog("info")) {
    console.info(formatMessage("info", provider, action, message));
  }
}

export function warn(provider: ProviderName | string, action: string, message: string): void {
  if (shouldLog("warn")) {
    console.warn(formatMessage("warn", provider, action, message));
  }
}

export function error(provider: ProviderName | string, action: string, message: string): void {
  if (shouldLog("error")) {
    console.error(formatMessage("error", provider, action, message));
  }
}

export function logResult(result: ProviderResult): void {
  if (result.success) {
    info(result.provider, result.action, `completed in ${result.duration}ms`);
  } else {
    error(result.provider, result.action, `failed in ${result.duration}ms: ${result.error}`);
  }
}

const operationLog: ProviderOperationLog[] = [];

export function recordOperation(log: ProviderOperationLog): void {
  operationLog.push(log);
}

export function getOperationLog(): ProviderOperationLog[] {
  return [...operationLog];
}

export function clearOperationLog(): void {
  operationLog.length = 0;
}
