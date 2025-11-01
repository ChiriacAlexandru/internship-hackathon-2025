import { runRuleChecks } from "./app.backend/src/services/ruleEngine.js";
import fs from "fs";

// Simulate what the pre-commit hook sends
const files = [
  {
    path: "bad-code.js",
    content: fs.readFileSync("bad-code.js", "utf-8"),
  },
  {
    path: "test-violations.js",
    content: fs.readFileSync("test-violations.js", "utf-8"),
  },
];

console.log("=== Testing Rule Engine with Project 3 Rules ===\n");
console.log("Files to check:");
files.forEach((f) => {
  console.log(`  - ${f.path} (${f.content.split("\n").length} lines)`);
  console.log(`    Contains console.log: ${f.content.includes("console.log")}`);
});

console.log("\n--- Running rule checks for Project 3 ---\n");

const findings = await runRuleChecks(files, { projectId: 3 });

console.log("\n=== RESULTS ===");
console.log("Total findings:", findingsdadss.length);

if (findings.length > 0) {
  console.log("\nFindings:");
  findings.forEach((f, i) => {
    console.log(`\n${i + 1}. ${f.title}`);
    console.log(`   File: ${f.file}:${f.line_start}`);
    console.log(`   Severity: ${f.severity}`);
    console.log(`   Message: ${f.explanation}`);
  });
} else {
  console.log("\n❌ NO FINDINGS DETECTED - This is the problem!");
}
