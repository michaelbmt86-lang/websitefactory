import type { DeliveryHealthState } from "./delivery-health";

export type DeliveryEventType =
  | "deployment-started"
  | "deployment-completed"
  | "deployment-failed"
  | "step-started"
  | "step-completed"
  | "step-failed"
  | "step-retried"
  | "dns-configured"
  | "dns-verified"
  | "https-verified"
  | "production-verified"
  | "rollback-started"
  | "rollback-completed"
  | "rollback-failed"
  | "health-changed"
  | "report-archived"
  | "error-occurred";

export interface DeliveryEvent {
  readonly type: DeliveryEventType;
  readonly timestamp: string;
  readonly deploymentId: string;
  readonly stepId?: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

export interface DeliveryDeploymentStartedEvent extends DeliveryEvent {
  readonly type: "deployment-started";
  readonly data: {
    domain: string;
    environment: string;
    gitCommit: string | null;
  };
}

export interface DeliveryDeploymentCompletedEvent extends DeliveryEvent {
  readonly type: "deployment-completed";
  readonly data: {
    duration: number;
    vercelProjectId: string;
    vercelDeploymentUrl: string;
  };
}

export interface DeliveryDeploymentFailedEvent extends DeliveryEvent {
  readonly type: "deployment-failed";
  readonly data: {
    failedStep: string;
    error: string;
    duration: number;
  };
}

export interface DeliveryStepStartedEvent extends DeliveryEvent {
  readonly type: "step-started";
  readonly data: {
    stepId: string;
    phase: string;
  };
}

export interface DeliveryStepCompletedEvent extends DeliveryEvent {
  readonly type: "step-completed";
  readonly data: {
    stepId: string;
    duration: number;
  };
}

export interface DeliveryStepFailedEvent extends DeliveryEvent {
  readonly type: "step-failed";
  readonly data: {
    stepId: string;
    error: string;
    retryCount: number;
  };
}

export interface DeliveryHealthChangedEvent extends DeliveryEvent {
  readonly type: "health-changed";
  readonly data: {
    previousState: DeliveryHealthState;
    newState: DeliveryHealthState;
    score: number;
  };
}

export interface DeliveryRollbackStartedEvent extends DeliveryEvent {
  readonly type: "rollback-started";
  readonly data: {
    triggerDeploymentId: string;
    reason: string;
  };
}

export interface DeliveryRollbackCompletedEvent extends DeliveryEvent {
  readonly type: "rollback-completed";
  readonly data: {
    targetDeploymentId: string;
    duration: number;
    verificationPassed: boolean;
  };
}

export interface DeliveryErrorOccurredEvent extends DeliveryEvent {
  readonly type: "error-occurred";
  readonly data: {
    error: string;
    phase: string;
    recoverable: boolean;
  };
}

export interface DeliveryEventHistoryLimits {
  readonly maxEvents: number;
  readonly maxRetentionMs: number;
}

export const DEFAULT_DELIVERY_EVENT_HISTORY_LIMITS: DeliveryEventHistoryLimits = {
  maxEvents: 500,
  maxRetentionMs: 86400000,
};
