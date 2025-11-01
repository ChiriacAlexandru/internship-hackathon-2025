// Debug test with detailed logging

import { runRuleChecks } from './app.backend/src/services/ruleEngine.js';
import { persistReviewSession } from './app.backend/src/services/reviewPersistence.js';
import fs from 'fs';

const files = [
  {
    path: 'bad-code.js',
    content: fs.readFileSync('bad-code.js', 'utf-8')
  }
];

console.log('=== Step 1: Run Rule Checks ===\n');
const ruleFindings = await runRuleChecks(files, { projectId: 3 });

console.log(`\nRule findings: ${ruleFindings.length}`);
ruleFindings.forEach((f, i) => {
  console.log(`  ${i + 1}. ${f.title} at ${f.file}:${f.line_start} [${f.severity}]`);
});

console.log('\n=== Step 2: Persist Review Session ===\n');

const persisted = await persistReviewSession({
  metadata: {
    projectId: 3,
    userId: null,
    mode: 'pre-commit',
  },
  files,
  findings: ruleFindings,
  usage: null,
});

console.log('Persisted review:', persisted);

if (persisted && persisted.id) {
  console.log('\n=== Step 3: Check if findings were saved ===\n');
  
  const pool = (await import('./app.backend/src/db/pool.js')).default;
  
  const result = await pool.query(
    'SELECT * FROM findings WHERE review_id = $1',
    [persisted.id]
  );
  
  console.log(`Found ${result.rows.length} findings in database:`);
  result.rows.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.title} at ${f.file}:${f.line_start} [${f.severity}]`);
  });
  
  if (result.rows.length === 0) {
    console.log('\n❌ PROBLEM: Findings were NOT saved to database!');
  } else {
    console.log('\n✅ Findings were saved successfully!');
  }
  
  await pool.end();
} else {
  console.log('\n❌ Review was not persisted!');
}
