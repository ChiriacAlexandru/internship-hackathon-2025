// Test to check specific commit findings

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

async function getCommitDetails(token, commitId) {
  console.log(`\n=== Checking Commit ID: ${commitId} ===\n`);

  const response = await fetch(`${API_URL}/projects/commits/${commitId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log("Commit details:", JSON.stringify(data, null, 2));
}

async function main() {
  const token = await login();

  // Check commit ID 10 which has 1 finding
  await getCommitDetails(token, 10);

  // Check commit ID 2 which has 0 findings but includes bad-code.js
  await getCommitDetails(token, 2);
}

main().catch(console.error);
