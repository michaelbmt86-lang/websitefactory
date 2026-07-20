import fs from "node:fs";
import path from "node:path";
import { getContext } from "./context";
import Vercel from "./providers/vercel";
import * as log from "./providers/logger";
import { sanitizeSlug } from "./providers/utils";
import type { PipelineState, StepResult } from "./deploy";

/* ============================================================================
 * Interfaces
 * ============================================================================
 */

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

/* ============================================================================
 * Internal helpers
 * ============================================================================
 */

function loadWorkflow(): WorkflowDefinition {
  const workflowPath = path.join(
    getContext().deploymentRoot,
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
  const domain = getContext().targetDomain;
  const projectFolder = domain.replace(/\./g, "-");

  return {
    domain,
    environment: getContext().environment,
    repoFullName: getContext().githubRepository,
    projectSlug: getContext().projectSlug,
    projectFolder,
    vercelProjectName: "",
    zoneId: "",
    projectId: "",
    deploymentId: "",
    deploymentUrl: "",
    repairHistory: [],
    checks: [],
    failureReason: null,
  };
}

function makeStepResult(
  step: number,
  name: string,
  provider: string,
  passed: boolean,
  message: string,
  duration: number,
): StepResult {
  return { step, name, provider, passed, message, duration };
}

/* ============================================================================
 * Slug generation
 *
 * Extracts a clean project slug from the target domain.
 *   biopak.com           → biopak
 *   www.example-site.com → example-site
 *   staging.shop.io      → staging-shop
 * ============================================================================
 */

function generateProjectSlug(domain: string): string {
  let slug = domain
    .replace(/^www\./, "")
    .split(".")[0]
    .toLowerCase();

  slug = sanitizeSlug(slug);

  if (!slug) {
    throw new Error(`Could not generate slug from domain: ${domain}`);
  }

  return slug;
}

/* ============================================================================
 * Unique project name generator
 *
 * Tries: slug → slug-2 → slug-3 → slug-YYYYMMDD → slug-YYYYMMDD-2
 * Stops at the first name that does NOT exist on Vercel.
 * Never reuses. Never overwrites.
 * ============================================================================
 */

function dateStamp(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function projectNameCandidates(slug: string): string[] {
  const stamp = dateStamp();
  return [
    slug,
    `${slug}-2`,
    `${slug}-3`,
    `${slug}-4`,
    `${slug}-5`,
    `${slug}-prod`,
    `${slug}-${stamp}`,
    `${slug}-${stamp}-2`,
  ];
}

/* ============================================================================
 * Pre-deployment steps (injected automatically before user workflow)
 * Monorepo mode: slug generation only. Project creation handled by create_project step.
 * ============================================================================
 */

async function preDeploymentGenerateSlug(
  state: PipelineState,
  stepNum: number,
): Promise<StepResult> {
  const name = "generate_project_slug";
  const provider = "workflow";
  const start = Date.now();

  try {
    const slug = generateProjectSlug(state.domain);
    state.projectSlug = slug;
    state.projectFolder = state.domain.replace(/\./g, "-");

    log.info("workflow", name, `domain="${state.domain}" → slug="${slug}" folder="${state.projectFolder}"`);
    return makeStepResult(stepNum, name, provider, true, `slug="${slug}" folder="${state.projectFolder}"`, Date.now() - start);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return makeStepResult(stepNum, name, provider, false, msg, Date.now() - start);
  }
}

async function preDeploymentCheckAndCreateProject(
  state: PipelineState,
  stepNum: number,
): Promise<StepResult> {
  const name = "ensure_unique_project";
  const provider = "vercel";
  const start = Date.now();

  try {
    const candidates = projectNameCandidates(state.projectSlug);
    let created = false;

    for (const candidate of candidates) {
      log.info("workflow", name, `trying project name: ${candidate}`);

      const result = await Vercel.createProject({
        name: candidate,
        framework: "nextjs",
      });

      if (result.success && result.data) {
        state.projectId = result.data.projectId;
        state.vercelProjectName = result.data.name;
        created = true;

        log.info("workflow", name, `created project: ${result.data.name} (${result.data.projectId})`);
        break;
      }

      const err = result.error ?? "";

      if (err.includes("409") || err.includes("already exists")) {
        log.info("workflow", name, `"${candidate}" already exists — trying next`);
        continue;
      }

      throw new Error(`createProject failed for "${candidate}": ${err}`);
    }

    if (!created) {
      throw new Error(
        `All project name candidates exhausted for slug "${state.projectSlug}". ` +
        `Tried: ${candidates.join(", ")}`,
      );
    }

    const duration = Date.now() - start;
    return makeStepResult(
      stepNum,
      name,
      provider,
      true,
      `project="${state.vercelProjectName}" id="${state.projectId}"`,
      duration,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return makeStepResult(stepNum, name, provider, false, msg, Date.now() - start);
  }
}

/* ============================================================================
 * Main workflow runner
 * ============================================================================
 */

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

  /* ========================================================================
   * Pre-deployment phase
   * ======================================================================== */

  log.info("workflow", "preDeployment", "=== PRE-DEPLOYMENT PHASE ===");

  const slugResult = await preDeploymentGenerateSlug(state, 0);
  results.push(slugResult);
  if (!slugResult.passed) {
    log.error("workflow", "preDeployment", `slug generation failed: ${slugResult.message}`);
    return buildRunResult(workflow, results, true, start);
  }

  log.info(
    "workflow",
    "preDeployment",
    `ready: slug="${state.projectSlug}", folder="${state.projectFolder}"`,
  );

  /* ========================================================================
   * User workflow phase
   * ======================================================================== */

  log.info("workflow", "userWorkflow", "=== USER WORKFLOW PHASE ===");

  let userStepCounter = 0;

  for (const step of workflow.steps) {
    userStepCounter++;

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

  if (stoppedEarly) {
    log.warn("workflow", "userWorkflow", "user workflow stopped early due to fail_fast");
    return buildRunResult(workflow, results, true, start);
  }

  /* ========================================================================
   * Build final result
   * ======================================================================== */

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

  if (passed) {
    log.info(
      "workflow",
      "runWorkflow",
      `ALL PASSED: ${passedSteps}/${results.length} steps (${totalDuration}ms)`,
    );
  } else {
    log.error(
      "workflow",
      "runWorkflow",
      `FAILED: ${failedSteps}/${results.length} steps failed (${totalDuration}ms)`,
    );
  }

  return {
    workflowName: workflow.workflow_name,
    version: workflow.version,
    results,
    totalSteps: workflow.steps.length + 2,
    executedSteps,
    skippedSteps,
    passedSteps,
    failedSteps,
    stoppedEarly,
    passed,
    totalDuration,
  };
}

function buildRunResult(
  workflow: WorkflowDefinition,
  results: StepResult[],
  stoppedEarly: boolean,
  start: number,
): WorkflowRunResult {
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

  return {
    workflowName: workflow.workflow_name,
    version: workflow.version,
    results,
    totalSteps: workflow.steps.length + 2,
    executedSteps,
    skippedSteps,
    passedSteps,
    failedSteps,
    stoppedEarly,
    passed,
    totalDuration,
  };
}

/* ============================================================================
 * Convenience: load workflow from disk and run
 * ============================================================================
 */

export async function loadAndRunWorkflow(
  executor: WorkflowExecutor,
  dryRun: boolean,
): Promise<WorkflowRunResult> {
  const workflow = loadWorkflow();
  const state = buildInitialState();
  return runWorkflow(workflow, executor, state, dryRun);
}

/* ============================================================================
 * Pretty-print
 * ============================================================================
 */

export function printWorkflowResult(result: WorkflowRunResult): void {
  console.log("");
  console.log("=".repeat(70));
  console.log("  WORKFLOW RESULT");
  console.log("=".repeat(70));
  console.log(`  Workflow:    ${result.workflowName} v${result.version}`);
  console.log(`  Status:      ${result.passed ? "ALL PASSED" : "FAILED"}`);
  console.log(`  Steps:       ${result.passedSteps}/${result.results.length} passed`);
  console.log(`  Executed:    ${result.executedSteps}`);
  console.log(`  Skipped:     ${result.skippedSteps}`);
  console.log(`  Failed:      ${result.failedSteps}`);
  console.log(`  Stopped:     ${result.stoppedEarly ? "yes (fail_fast)" : "no"}`);
  console.log(`  Duration:    ${result.totalDuration}ms`);
  console.log("-".repeat(70));

  for (const r of result.results) {
    const icon = r.passed ? "[PASS]" : "[FAIL]";
    const provider = r.provider.padEnd(12);
    const name = r.name.padEnd(30);
    const duration = r.duration > 0 ? `(${r.duration}ms)` : "";
    console.log(`  ${icon} ${provider} ${name} ${r.message} ${duration}`);
  }

  console.log("=".repeat(70));
  console.log("");
}
