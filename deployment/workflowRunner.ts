import fs from "node:fs";
import path from "node:path";
import { Context } from "./context";
import * as log from "./providers/logger";
import type { PipelineState, StepResult } from "./deploy";

export interface WorkflowStep {
  step: number;
  id: string;
  action: string;
  provider: string;
  enabled: boolean;
  required: boolean;
}

export interface WorkflowDefinition {
  workflow_name: string;
  version: string;
  description: string;
  continue_on_error: boolean;
  fail_fast: boolean;
  steps: WorkflowStep[];
}

export type WorkflowExecutor = Record<
  string,
  (
    state: PipelineState,
    step: WorkflowStep,
    dryRun: boolean,
  ) => Promise<StepResult>
>;

export interface WorkflowRunResult {
  workflowName: string;
  version: string;
  results: StepResult[];
  totalSteps: number;
  executedSteps: number;
  skippedSteps: number;
  passedSteps: number;
  failedSteps: number;
  stoppedEarly: boolean;
  passed: boolean;
  totalDuration: number;
}

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = path.join(
    Context.deploymentRoot,
    "deployment.workflow.json",
  );
  const raw = fs.readFileSync(workflowPath, "utf8");
  return JSON.parse(raw) as WorkflowDefinition;
}

function validateWorkflow(workflow: WorkflowDefinition): void {
  if (!workflow.workflow_name) {
    throw new Error("workflow_name is missing");
  }
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    throw new Error("steps is missing or not an array");
  }
  for (const step of workflow.steps) {
    if (typeof step.step !== "number") {
      throw new Error(`step number is missing at index ${workflow.steps.indexOf(step)}`);
    }
    if (!step.action) {
      throw new Error(`action is missing for step ${step.step}`);
    }
    if (!step.provider) {
      throw new Error(`provider is missing for step ${step.step}`);
    }
  }
}

function buildInitialState(): PipelineState {
  return {
    domain: Context.targetDomain,
    environment: Context.environment,
    repoFullName: Context.githubRepository,
    projectSlug: Context.projectSlug,
    zoneId: "",
    projectId: "",
    deploymentId: "",
    deploymentUrl: "",
  };
}

export async function runWorkflow(
  workflow: WorkflowDefinition,
  executor: WorkflowExecutor,
  state: PipelineState,
  dryRun: boolean,
): Promise<WorkflowRunResult> {
  const start = Date.now();

  validateWorkflow(workflow);

  log.info(
    "workflow",
    "runWorkflow",
    `starting workflow "${workflow.workflow_name}" v${workflow.version} (dryRun=${dryRun}, fail_fast=${workflow.fail_fast})`,
  );

  const results: StepResult[] = [];
  let stoppedEarly = false;

  for (const step of workflow.steps) {
    if (!step.enabled) {
      log.info("workflow", step.id, `SKIPPED — step disabled`);
      results.push({
        step: step.step,
        name: step.id,
        provider: step.provider,
        passed: true,
        message: "step disabled",
        duration: 0,
      });
      continue;
    }

    const handler = executor[step.action];
    if (!handler) {
      const message = `no executor registered for action "${step.action}"`;
      log.warn("workflow", step.id, message);
      results.push({
        step: step.step,
        name: step.id,
        provider: step.provider,
        passed: false,
        message,
        duration: 0,
      });

      if (workflow.fail_fast) {
        stoppedEarly = true;
        break;
      }
      continue;
    }

    const result = await handler(state, step, dryRun);
    results.push(result);

    if (!result.passed) {
      log.error(
        "workflow",
        step.id,
        `failed: ${result.message} (${result.duration}ms)`,
      );

      if (workflow.fail_fast) {
        stoppedEarly = true;
        break;
      }
    }
  }

  const totalDuration = Date.now() - start;
  const executedSteps = results.filter(
    (r) => r.message !== "step disabled",
  ).length;
  const skippedSteps = results.filter(
    (r) => r.message === "step disabled",
  ).length;
  const passedSteps = results.filter((r) => r.passed).length;
  const failedSteps = results.filter((r) => !r.passed).length;
  const passed = failedSteps === 0;

  log.info(
    "workflow",
    "runWorkflow",
    `finished: ${passedSteps} passed, ${failedSteps} failed, ${skippedSteps} skipped, stopped_early=${stoppedEarly} (${totalDuration}ms)`,
  );

  return {
    workflowName: workflow.workflow_name,
    version: workflow.version,
    results,
    totalSteps: workflow.steps.length,
    executedSteps,
    skippedSteps,
    passedSteps,
    failedSteps,
    stoppedEarly,
    passed,
    totalDuration,
  };
}

export async function loadAndRunWorkflow(
  executor: WorkflowExecutor,
  dryRun: boolean,
): Promise<WorkflowRunResult> {
  const workflow = loadWorkflow();
  const state = buildInitialState();
  return runWorkflow(workflow, executor, state, dryRun);
}

export function printWorkflowResult(result: WorkflowRunResult): void {
  console.log("");
  console.log("=".repeat(70));
  console.log("  WORKFLOW RESULT");
  console.log("=".repeat(70));
  console.log(`  Workflow:    ${result.workflowName} v${result.version}`);
  console.log(`  Status:      ${result.passed ? "ALL PASSED" : "FAILED"}`);
  console.log(`  Steps:       ${result.passedSteps}/${result.totalSteps} passed`);
  console.log(`  Executed:    ${result.executedSteps}`);
  console.log(`  Skipped:     ${result.skippedSteps}`);
  console.log(`  Failed:      ${result.failedSteps}`);
  console.log(`  Stopped:     ${result.stoppedEarly ? "yes (fail_fast)" : "no"}`);
  console.log(`  Duration:    ${result.totalDuration}ms`);
  console.log("-".repeat(70));

  for (const r of result.results) {
    const icon = r.passed ? "[PASS]" : "[FAIL]";
    const provider = r.provider.padEnd(12);
    const name = r.name.padEnd(25);
    const duration = r.duration > 0 ? `(${r.duration}ms)` : "";
    console.log(`  ${icon} ${provider} ${name} ${r.message} ${duration}`);
  }

  console.log("=".repeat(70));
  console.log("");
}
