// Test the full pre-commit flow to see if findings are persisted

const API_URL = 'http://localhost:3000';

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin'
    })
  });
  
  const data = await response.json();
  return data.token;
}

async function simulatePreCommit(token, projectId, files) {
  console.log('\n=== Simulating Pre-Commit Check ===\n');
  console.log(`Project ID: ${projectId}`);
  console.log(`Files: ${files.map(f => f.path).join(', ')}\n`);
  
  const response = await fetch(`${API_URL}/review/pre-commit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      projectId: projectId,
      files: files,
      branchName: 'test-branch',
      authorEmail: 'test@example.com',
      commitMessage: 'Test commit with console.log'
    })
  });
  
  if (!response.ok) {
    console.error('Pre-commit check failed:', response.status);
    const text = await response.text();
    console.error('Response:', text);
    return null;
  }
  
  const result = await response.json();
  console.log('Pre-commit result:', JSON.stringify(result, null, 2));
  
  return result;
}

async function checkCommitDetails(token, commitCheckId) {
  console.log(`\n=== Checking Commit Details (ID: ${commitCheckId}) ===\n`);
  
  const response = await fetch(`${API_URL}/projects/commits/${commitCheckId}`, {
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  
  const data = await response.json();
  console.log('Stored findings:', data.findings?.length || 0);
  
  if (data.findings && data.findings.length > 0) {
    console.log('\n✅ Findings are stored in DB!');
    data.findings.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.title}`);
      console.log(`   File: ${f.file}:${f.line_start}`);
      console.log(`   Severity: ${f.severity}`);
    });
  } else {
    console.log('\n❌ NO FINDINGS IN DATABASE!');
    console.log('This is the problem - findings are not being persisted.');
  }
  
  return data;
}

async function main() {
  const token = await login();
  console.log('✅ Logged in');
  
  // Use project 3 which has console.log rules
  const projectId = 3;
  
  // Read test files
  const fs = await import('fs');
  const files = [
    {
      path: 'bad-code.js',
      content: fs.readFileSync('bad-code.js', 'utf-8')
    }
  ];
  
  // Simulate pre-commit check
  const preCommitResult = await simulatePreCommit(token, projectId, files);
  
  if (!preCommitResult) {
    console.error('Pre-commit check failed');
    return;
  }
  
  console.log(`\n📊 Pre-commit returned:`);
  console.log(`   Total findings: ${preCommitResult.totalFindings}`);
  console.log(`   Findings in response: ${preCommitResult.findings?.length || 0}`);
  console.log(`   Commit check ID: ${preCommitResult.commitCheckId}`);
  
  // Now check if those findings were persisted
  if (preCommitResult.commitCheckId) {
    await checkCommitDetails(token, preCommitResult.commitCheckId);
  }
}

main().catch(console.error);
