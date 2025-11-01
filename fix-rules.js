// Fix the rules that have null patterns

const API_URL = "http://localhost:3000";

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "admin",
    }),
  });
  const data = await response.json();
  return data.token;
}

async function fixRules() {
  const pool = (await import("./app.backend/src/db/pool.js")).default;

  // Update rule 10 to have the correct pattern
  await pool.query(`
    UPDATE rules 
    SET pattern = 'console\\.log'
    WHERE id = 10
  `);

  console.log("✅ Fixed rule 10 - added pattern");

  // Check all rules
  const result = await pool.query(`
    SELECT id, key, pattern, level, message 
    FROM rules 
    WHERE project_id = 3 OR project_id = 5
    ORDER BY project_id, id
  `);

  console.log("\n📋 Current rules:");
  result.rows.forEach((r) => {
    console.log(
      `  Rule ${r.id}: ${r.key} - pattern: "${r.pattern}" - level: ${r.level}`
    );
  });

  await pool.end();
}

fixRules().catch(console.error);
