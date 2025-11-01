// Quick test to check API endpoints

const API_URL = 'http://localhost:3000';

// First, login to get token
async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin'
    })
  });
  
  if (!response.ok) {
    console.error('Login failed:', response.status);
    return null;
  }
  
  const data = await response.json();
  return data.token;
}

async function testCommitChecks(token, projectId) {
  console.log(`\nFetching commit checks for project ${projectId}...`);
  
  const response = await fetch(`${API_URL}/projects/${projectId}/commits`, {
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  
  if (!response.ok) {
    console.error('Failed to fetch commits:', response.status);
    const text = await response.text();
    console.error('Response:', text);
    return;
  }
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

async function testProjects(token) {
  console.log('\nFetching projects...');
  
  const response = await fetch(`${API_URL}/projects`, {
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  
  if (!response.ok) {
    console.error('Failed to fetch projects:', response.status);
    return [];
  }
  
  const data = await response.json();
  console.log('Projects:', JSON.stringify(data, null, 2));
  return data.projects || [];
}

async function main() {
  console.log('=== Testing API ===\n');
  
  const token = await login();
  if (!token) {
    console.error('Could not login');
    return;
  }
  
  console.log('✅ Login successful');
  
  const projects = await testProjects(token);
  
  if (projects.length > 0) {
    for (const project of projects) {
      const projectId = project.id || project.projectId || project.project_id;
      await testCommitChecks(token, projectId);
    }
  } else {
    console.log('\n⚠️  No projects found');
  }
}

main().catch(console.error);
