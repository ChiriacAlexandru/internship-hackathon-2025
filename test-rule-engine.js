import { runRuleChecks } from './app.backend/src/services/ruleEngine.js';

const testFiles = [
  {
    path: 'test.js',
    content: `
function test() {
  console.log("Hello");
  // TODO: fix this
  return true;
}
`
  }
];

console.log('Testing rule engine...\n');

const findings = await runRuleChecks(testFiles, { projectId: null });

console.log('\n=== RESULTS ===');
console.log('Total findings:', findings.length);
console.log('\nFindings:');
findings.forEach((f, i) => {
  console.log(`\n${i + 1}. ${f.title}`);
  console.log(`   File: ${f.file}:${f.line_start}`);
  console.log(`   Severity: ${f.severity}`);
  console.log(`   Message: ${f.explanation}`);
});
