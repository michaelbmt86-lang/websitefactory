import { analyzeWebsite } from "../src/analyzer/website-analyzer";

const result = analyzeWebsite();

console.log("");
console.log("======================================");
console.log("      WEBSITE ANALYZER REPORT");
console.log("======================================");
console.log("");

console.log(JSON.stringify(result, null, 2));

console.log("");
console.log("======================================");
console.log("Analysis Complete");
console.log("======================================");