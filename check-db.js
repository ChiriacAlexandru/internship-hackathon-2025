import pool from "./app.backend/src/db/pool.js";

console.log("Checking database for commit checks...\n");

try {
  // Check commit_checks table
  const checksResult = await pool.query(`
    SELECT 
      id, project_id, commit_hash, branch_name, 
      passed, total_findings, critical_findings,
      author_email, created_at
    FROM commit_checks 
    ORDER BY created_at DESC 
    LIMIT 10
  `);

  console.log(`Found ${checksResult.rows.length} commit checks:`);
  checksResult.rows.forEach((check) => {
    console.log(`\n- ID: ${check.id}`);
    console.log(`  Project: ${check.project_id}`);
    console.log(`  Branch: ${check.branch_name}`);
    console.log(`  Author: ${check.author_email}`);
    console.log(`  Passed: ${check.passed}`);
    console.log(`  Total Findings: ${check.total_findings}`);
    console.log(`  Critical: ${check.critical_findings}`);
    console.log(`  Created: ${check.created_at}`);
  });

  // Check reviews table
  console.log("\n\n=== Checking Reviews ===\n");
  const reviewsResult = await pool.query(`
    SELECT id, project_id, mode, created_at
    FROM reviews 
    ORDER BY created_at DESC 
    LIMIT 10
  `);

  console.log(`Found ${reviewsResult.rows.length} reviews`);

  // Check findings table
  console.log("\n\n=== Checking Findings ===\n");
  const findingsResult = await pool.query(`
    SELECT 
      f.id, f.review_id, f.file, f.line_start, 
      f.severity, f.title, f.explanation
    FROM findings f
    ORDER BY f.id DESC 
    LIMIT 20
  `);

  console.log(`Found ${findingsResult.rows.length} findings:`);
  findingsResult.rows.forEach((finding) => {
    console.log(`\n- ID: ${finding.id}, Review: ${finding.review_id}`);
    console.log(`  File: ${finding.file}:${finding.line_start}`);
    console.log(`  Severity: ${finding.severity}`);
    console.log(`  Title: ${finding.title}`);
  });
} catch (error) {
  console.error("Error:", error);
} finally {
  await pool.end();
}
