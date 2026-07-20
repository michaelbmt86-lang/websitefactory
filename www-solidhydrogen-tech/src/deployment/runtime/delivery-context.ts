import type { DeliveryHealthState } from "./delivery-health";
import type { DeliveryPhase } from "./delivery-status";

export interface DeliveryStepContext {
  readonly stepId: string;
  readonly phase: DeliveryPhase;
  provider: string;
  action: string;
  startedAt: string | null;
  completedAt: string | null;
  retryCount: number;
  maxRetries: number;
}

export interface DeliveryDeploymentContext {
  deploymentId: string;
  domain: string;
  environment: string;
  gitCommit: string | null;
  gitBranch: string | null;
  vercelProjectId: string | null;
  vercelDeploymentUrl: string | null;
  phase: DeliveryPhase;
  healthState: DeliveryHealthState;
  startedAt: string;
  completedAt: string | null;
}

export interface DeliverySessionContext {
  sessionId: string;
  startedAt: string;
  configuration: DeliveryConfiguration;
  activeDeployment: DeliveryDeploymentContext | null;
  previousDeployment: DeliveryDeploymentContext | null;
}

export interface DeliveryConfiguration {
  domain: {
    registrar: string;
    dnsProvider: string;
    deploymentProvider: string;
    configFile: string;
  };
  providers: {
    github: { envVar: string; method: string };
    vercel: { envVar: string; apiVersion: string; pollInterval: number; pollAttempts: number };
    cloudflare: { envVar: string; apiVersion: string; sslMode: string };
  };
  verification: {
    preDeploymentChecks: number;
    postDeploymentChecks: number;
    dnsPollAttempts: number;
    dnsPollInterval: number;
    httpsPollAttempts: number;
    httpsPollInterval: number;
  };
  rollback: {
    enabled: boolean;
    automatic: boolean;
    requireApproval: boolean;
  };
}

export const DEFAULT_DELIVERY_CONFIGURATION: DeliveryConfiguration = {
  domain: {
    registrar: "namecheap",
    dnsProvider: "cloudflare",
    deploymentProvider: "vercel",
    configFile: "deployment/domain.config.json",
  },
  providers: {
    github: { envVar: "GITHUB_TOKEN", method: "git-data-api" },
    vercel: { envVar: "VERCEL_TOKEN", apiVersion: "v13", pollInterval: 10000, pollAttempts: 30 },
    cloudflare: { envVar: "CLOUDFLARE_API_TOKEN", apiVersion: "v4", sslMode: "full" },
  },
  verification: {
    preDeploymentChecks: 10,
    postDeploymentChecks: 19,
    dnsPollAttempts: 10,
    dnsPollInterval: 5000,
    httpsPollAttempts: 10,
    httpsPollInterval: 10000,
  },
  rollback: {
    enabled: true,
    automatic: false,
    requireApproval: true,
  },
};

export const DELIVERY_STATE_TRANSITIONS_CONTEXT: Record<DeliveryPhase, DeliveryPhase[]> = {
  idle: ["building"],
  building: ["pushing", "failed"],
  pushing: ["deploying", "failed"],
  deploying: ["configuring", "failed"],
  configuring: ["verifying", "failed"],
  verifying: ["completed", "failed", "rolling-back"],
  completed: ["idle"],
  failed: ["rolling-back", "idle"],
  "rolling-back": ["idle"],
};
