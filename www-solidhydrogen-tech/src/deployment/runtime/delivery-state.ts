import type { DeliveryPhase } from "./delivery-status";
import type { DeliveryHealthState } from "./delivery-health";

export type DeliveryStepOutcome = "success" | "failure" | "skipped" | "pending";

export interface DeliveryStepStatus {
  readonly stepId: string;
  phase: DeliveryPhase;
  outcome: DeliveryStepOutcome;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
  retryCount: number;
}

export type DeliveryDeploymentOutcome = "success" | "failure" | "rolled-back";

export interface DeliveryDeploymentStatus {
  deploymentId: string;
  outcome: DeliveryDeploymentOutcome;
  domain: string;
  environment: string;
  phase: DeliveryPhase;
  healthState: DeliveryHealthState;
  startedAt: string;
  completedAt: string | null;
  totalDuration: number | null;
  stepsCompleted: number;
  stepsFailed: number;
  failureStep: string | null;
}

export type DeliveryVerificationOutcome = "pass" | "fail" | "warn" | "skip";

export interface DeliveryVerificationStatus {
  verificationId: string;
  deploymentId: string;
  outcome: DeliveryVerificationOutcome;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  skippedChecks: number;
  duration: number | null;
  timestamp: string;
}

export interface DeliveryStateSummary {
  currentPhase: DeliveryPhase;
  healthState: DeliveryHealthState;
  activeDeployment: DeliveryDeploymentStatus | null;
  lastCompletedDeployment: DeliveryDeploymentStatus | null;
  lastVerification: DeliveryVerificationStatus | null;
  totalDeployments: number;
  successRate: number;
}

export const DELIVERY_STEP_TRANSITIONS: Record<DeliveryStepOutcome, DeliveryStepOutcome[]> = {
  pending: ["success", "failure", "skipped"],
  success: [],
  failure: ["success"],
  skipped: [],
};

export const DELIVERY_DEPLOYMENT_TRANSITIONS: Record<DeliveryDeploymentOutcome, DeliveryDeploymentOutcome[]> = {
  success: [],
  failure: ["success", "rolled-back"],
  "rolled-back": ["success"],
};
