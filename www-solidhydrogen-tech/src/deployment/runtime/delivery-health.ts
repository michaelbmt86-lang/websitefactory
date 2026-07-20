export type DeliveryHealthState = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface DeliveryHealthScoreWeights {
  readonly infrastructure: number;
  readonly network: number;
  readonly content: number;
  readonly authentication: number;
  readonly seo: number;
}

export interface DeliveryHealthThresholds {
  readonly healthy: number;
  readonly degraded: number;
  readonly unhealthy: number;
}

export interface DeliveryHealthCheckConfig {
  readonly category: string;
  readonly weight: number;
  readonly critical: boolean;
}

export const DELIVERY_HEALTH_STATE_DEFINITIONS: Record<DeliveryHealthState, { label: string; description: string }> = {
  healthy: { label: "Healthy", description: "All deployment checks passing" },
  degraded: { label: "Degraded", description: "Some checks failing but site accessible" },
  unhealthy: { label: "Unhealthy", description: "Critical checks failing" },
  unknown: { label: "Unknown", description: "Health not yet assessed" },
};

export const DEFAULT_DELIVERY_HEALTH_SCORE_WEIGHTS: DeliveryHealthScoreWeights = {
  infrastructure: 0.25,
  network: 0.25,
  content: 0.25,
  authentication: 0.15,
  seo: 0.10,
};

export const DEFAULT_DELIVERY_HEALTH_THRESHOLDS: DeliveryHealthThresholds = {
  healthy: 90,
  degraded: 70,
  unhealthy: 0,
};

export const DELIVERY_HEALTH_CHECK_CONFIGS: Record<string, DeliveryHealthCheckConfig> = {
  "github-repo": { category: "infrastructure", weight: 0.5, critical: true },
  "vercel-project": { category: "infrastructure", weight: 0.5, critical: true },
  "dns-resolution": { category: "network", weight: 0.4, critical: true },
  "https-apex": { category: "network", weight: 0.3, critical: true },
  "https-www": { category: "network", weight: 0.3, critical: true },
  "homepage-status": { category: "content", weight: 0.3, critical: true },
  "dashboard-access": { category: "content", weight: 0.2, critical: false },
  "error-pages": { category: "content", weight: 0.2, critical: false },
  "ssl-errors": { category: "content", weight: 0.3, critical: true },
  "login-form": { category: "authentication", weight: 0.4, critical: false },
  "admin-account": { category: "authentication", weight: 0.3, critical: false },
  "admin-login": { category: "authentication", weight: 0.3, critical: false },
  "robots-txt": { category: "seo", weight: 0.5, critical: false },
  "sitemap-xml": { category: "seo", weight: 0.5, critical: false },
};

export interface DeliveryHealthMetrics {
  state: DeliveryHealthState;
  score: number;
  lastChecked: string | null;
  categoryScores: Record<string, number>;
}

export interface DeliveryHealthStatus {
  overall: DeliveryHealthMetrics;
  checks: Record<string, { passed: boolean; critical: boolean; duration?: number }>;
}
