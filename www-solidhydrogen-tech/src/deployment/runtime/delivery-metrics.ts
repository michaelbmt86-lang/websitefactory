export type DeliveryMetricName =
  | "deployment-total"
  | "deployment-success"
  | "deployment-failure"
  | "deployment-rollback"
  | "timing-build"
  | "timing-git-push"
  | "timing-vercel-deploy"
  | "timing-dns-configure"
  | "timing-dns-verify"
  | "timing-https-verify"
  | "timing-production-verify"
  | "timing-total-pipeline"
  | "verification-total"
  | "verification-passed"
  | "verification-failed";

export interface DeliveryMetricDefinition {
  readonly name: DeliveryMetricName;
  readonly label: string;
  readonly unit: "count" | "ms" | "percent" | "ratio";
  readonly description: string;
}

export const DELIVERY_METRIC_DEFINITIONS: DeliveryMetricDefinition[] = [
  { name: "deployment-total", label: "Total Deployments", unit: "count", description: "Total number of deployment attempts" },
  { name: "deployment-success", label: "Successful Deployments", unit: "count", description: "Number of successful deployments" },
  { name: "deployment-failure", label: "Failed Deployments", unit: "count", description: "Number of failed deployments" },
  { name: "deployment-rollback", label: "Rolled Back Deployments", unit: "count", description: "Number of deployments that were rolled back" },
  { name: "timing-build", label: "Build Time", unit: "ms", description: "Time spent building production artifacts" },
  { name: "timing-git-push", label: "Git Push Time", unit: "ms", description: "Time spent pushing code to GitHub" },
  { name: "timing-vercel-deploy", label: "Vercel Deploy Time", unit: "ms", description: "Time spent deploying to Vercel" },
  { name: "timing-dns-configure", label: "DNS Configure Time", unit: "ms", description: "Time spent configuring Cloudflare DNS" },
  { name: "timing-dns-verify", label: "DNS Verify Time", unit: "ms", description: "Time spent verifying DNS propagation" },
  { name: "timing-https-verify", label: "HTTPS Verify Time", unit: "ms", description: "Time spent verifying HTTPS certificates" },
  { name: "timing-production-verify", label: "Production Verify Time", unit: "ms", description: "Time spent running production verification checks" },
  { name: "timing-total-pipeline", label: "Total Pipeline Time", unit: "ms", description: "Total end-to-end pipeline duration" },
  { name: "verification-total", label: "Total Verification Checks", unit: "count", description: "Total number of verification checks run" },
  { name: "verification-passed", label: "Passed Verification Checks", unit: "count", description: "Number of verification checks that passed" },
  { name: "verification-failed", label: "Failed Verification Checks", unit: "count", description: "Number of verification checks that failed" },
];

export type DeliveryMetricsWindow = "current" | "1h" | "24h" | "7d" | "30d";

export interface DeliveryMetricsAggregationConfig {
  readonly windows: DeliveryMetricsWindow[];
  readonly defaultWindow: DeliveryMetricsWindow;
  readonly rollupInterval: number;
}

export const DEFAULT_DELIVERY_METRICS_AGGREGATION: DeliveryMetricsAggregationConfig = {
  windows: ["current", "1h", "24h", "7d", "30d"],
  defaultWindow: "24h",
  rollupInterval: 3600000,
};

export interface DeliveryMetricsRetentionConfig {
  readonly maxHistoryRecords: number;
  readonly maxDaysRetained: number;
}

export const DEFAULT_DELIVERY_METRICS_RETENTION: DeliveryMetricsRetentionConfig = {
  maxHistoryRecords: 100,
  maxDaysRetained: 90,
};

export interface DeliveryMetricsSummary {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  rolledBackDeployments: number;
  successRate: number;
  averageDeploymentTime: number;
  averageVerificationTime: number;
}
