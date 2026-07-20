import type { DeliveryPhase } from "./delivery-status";
import type { DeliveryHealthState } from "./delivery-health";

export interface RuntimeDeliveryStepStatus {
  readonly stepId: string;
  readonly phase: DeliveryPhase;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
}

export interface RuntimeDeliveryDeployment {
  readonly deploymentId: string;
  readonly domain: string;
  readonly environment: string;
  readonly gitCommit: string | null;
  readonly gitBranch: string | null;
  readonly vercelProjectId: string | null;
  readonly vercelDeploymentUrl: string | null;
  readonly phase: DeliveryPhase;
  readonly healthState: DeliveryHealthState;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly duration: number | null;
  readonly stepsCompleted: number;
  readonly failureStep: string | null;
}

export interface RuntimeDeliveryVerification {
  readonly verificationId: string;
  readonly deploymentId: string;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedChecks: number;
  readonly verdict: "PASS" | "FAIL" | "WARN";
  readonly timestamp: string;
  readonly duration: number | null;
}

export interface RuntimeDeliveryFailure {
  readonly deploymentId: string;
  readonly failedStep: string;
  readonly phase: DeliveryPhase;
  readonly error: string;
  readonly timestamp: string;
  readonly recoverable: boolean;
}

export interface RuntimeDeliveryHistoryLimits {
  readonly maxDeployments: number;
  readonly maxVerifications: number;
  readonly maxFailures: number;
}

export const DEFAULT_DELIVERY_HISTORY_LIMITS: RuntimeDeliveryHistoryLimits = {
  maxDeployments: 100,
  maxVerifications: 200,
  maxFailures: 50,
};

export interface RuntimeDeliveryStatus {
  readonly currentPhase: DeliveryPhase;
  readonly healthState: DeliveryHealthState;
  readonly steps: RuntimeDeliveryStepStatus[];
  readonly activeDeployment: RuntimeDeliveryDeployment | null;
  readonly lastVerification: RuntimeDeliveryVerification | null;
  readonly totalDeployments: number;
  readonly successfulDeployments: number;
  readonly failedDeployments: number;
  readonly rolledBackDeployments: number;
}
