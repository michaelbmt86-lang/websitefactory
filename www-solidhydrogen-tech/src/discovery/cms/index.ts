// ============================================================================
// CMS GENERATOR MODULE (Phase 4)
//
// Barrel export for the complete CMS generator engine.
// ============================================================================

export { generateCms } from "./cms-generator-engine";
export { generatePages } from "./page-generator";
export { generateBrands } from "./brand-generator";
export { generateCollections } from "./collection-generator";
export { generateBlogPosts } from "./blog-generator";
export { generateSeoMetadata } from "./seo-generator";
export { generateSearchIndex } from "./search-index-generator";
export { validateCmsQuality } from "./cms-quality-validator";
export {
  generateCmsManifest,
  generateCmsSearchOutput,
  generateCmsNavigation,
  generateCmsSitemap,
} from "./cms-output-generator";
