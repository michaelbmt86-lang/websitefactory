import "dotenv/config";
import { verifyDeployment, printReport as printVerifyReport } from "./deployment/verify";
import { deploy, printReport as printDeployReport } from "./deployment/deploy";

async function main() {
  console.log("=== STEP 1: VERIFY RUNTIME ===\n");
  const vReport = await verifyDeployment();
  printVerifyReport(vReport);

  if (!vReport.passed) {
    console.log("VERIFICATION FAILED — aborting deployment.");
    process.exit(1);
  }

  console.log("=== STEP 2: EXECUTE DEPLOYMENT ===\n");
  const dReport = await deploy({ dryRun: false });
  printDeployReport(dReport);

  if (!dReport.passed) {
    console.log("DEPLOYMENT FAILED.");
    process.exit(1);
  }

  console.log("DEPLOYMENT COMPLETE.");
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
