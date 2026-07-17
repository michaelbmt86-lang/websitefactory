// ============================================================================
// VERIFICATION MODULE (Phase 5)
//
// Barrel export for the complete verification engine.
// ============================================================================

export { runVerification } from "./verification-engine";
export { verifyPages } from "./page-verifier";
export { verifyProducts } from "./product-verifier";
export { verifyMedia } from "./media-verifier";
export { verifyLinks } from "./link-verifier";
export { verifySeo } from "./seo-verifier";
export { verifySchema } from "./schema-verifier";
export { verifyNavigation } from "./navigation-verifier";
export { verifyBuild } from "./build-verifier";
export { verifyDeployment } from "./deployment-verifier";
export { verifySqlite } from "./sqlite-verifier";
export { runAudit } from "./audit-engine";
export { runRepairs } from "./repair-engine";
