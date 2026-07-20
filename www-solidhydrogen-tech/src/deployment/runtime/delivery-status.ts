export type DeliveryPhase =
  | "idle"
  | "building"
  | "pushing"
  | "deploying"
  | "configuring"
  | "verifying"
  | "completed"
  | "failed"
  | "rolling-back";

export interface DeliveryStepStatus {
  readonly id: string;
  readonly phase: DeliveryPhase;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

export interface DeliveryPipelineStatus {
  currentPhase: DeliveryPhase;
  currentStep: string | null;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  steps: DeliveryStepStatus[];
}

export interface DeliveryPhaseDefinition {
  readonly label: string;
  readonly description: string;
}

export const DELIVERY_PHASE_DEFINITIONS: Record<DeliveryPhase, DeliveryPhaseDefinition> = {
  idle: { label: "Idle", description: "No deployment in progress" },
  building: { label: "Building", description: "Compiling production artifacts" },
  pushing: { label: "Pushing", description: "Pushing code to GitHub" },
  deploying: { label: "Deploying", description: "Deploying to Vercel" },
  configuring: { label: "Configuring", description: "Binding domains and DNS" },
  verifying: { label: "Verifying", description: "Running post-deployment checks" },
  completed: { label: "Completed", description: "Deployment successful" },
  failed: { label: "Failed", description: "Deployment failed" },
  "rolling-back": { label: "Rolling Back", description: "Reverting to previous deployment" },
};

export const DELIVERY_STATE_TRANSITIONS: Record<DeliveryPhase, DeliveryPhase[]> = {
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

export const DEFAULT_DELIVERY_STEPS: DeliveryStepStatus[] = [
  { id: "build-artifacts", phase: "building", status: "pending" },
  { id: "git-push", phase: "pushing", status: "pending" },
  { id: "vercel-deploy", phase: "deploying", status: "pending" },
  { id: "domain-bind", phase: "configuring", status: "pending" },
  { id: "dns-configure", phase: "configuring", status: "pending" },
  { id: "dns-verify", phase: "verifying", status: "pending" },
  { id: "https-verify", phase: "verifying", status: "pending" },
  { id: "production-verify", phase: "verifying", status: "pending" },
  { id: "report-archive", phase: "completed", status: "pending" },
];
