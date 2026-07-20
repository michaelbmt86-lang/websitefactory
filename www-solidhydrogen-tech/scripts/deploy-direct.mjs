import "dotenv/config";
import { deploy } from "../deployment/deploy.ts";

async function main() {
  console.log("=== DIRECT DEPLOYMENT (bypassing pre-verification) ===");
  console.log("Target: websitefactorytest.online");
  console.log("");

  const report = await deploy({
    dryRun: false,
    skipGitHub: false,
    skipCloudflare: false,
  });

  console.log("");
  console.log("=== DEPLOYMENT REPORT ===");
  console.log(`Status: ${report.passed ? "PASSED" : "FAILED"}`);
  console.log(`Duration: ${report.totalDuration}ms`);
  console.log(`URL: ${report.state.deploymentUrl || "N/A"}`);
  console.log(`Domain: ${report.state.domain}`);

  for (const step of report.steps) {
    const icon = step.passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] Step ${step.step}: ${step.name} — ${step.message} (${step.duration}ms)`);
  }

  if (!report.passed) {
    console.error("\nDeployment FAILED");
    process.exit(1);
  }

  console.log("\nDeployment PASSED");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
