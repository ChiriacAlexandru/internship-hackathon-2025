#!/usr/bin/env node

/**
 * AI Code Review - Pre-commit Hook
 * 
 * This hook automatically checks staged files before commit.
 * It sends files to the backend API for validation against mandatory rules.
 * If critical issues are found, the commit is blocked.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration (will be injected during installation)
const CONFIG = {
  API_URL: 'REPLACE_API_URL',
  PROJECT_ID: 'REPLACE_PROJECT_ID',
  AUTH_TOKEN: 'REPLACE_AUTH_TOKEN',
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    log('⚠️  Failed to get staged files', COLORS.yellow);
    return [];
  }
}

function getFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    log(`⚠️  Could not read file: ${filePath}`, COLORS.yellow);
    return null;
  }
}

function getGitInfo() {
  try {
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
    }).trim();

    const authorEmail = execSync('git config user.email', {
      encoding: 'utf-8',
    }).trim();

    return { branchName, authorEmail };
  } catch (error) {
    return { branchName: 'unknown', authorEmail: 'unknown' };
  }
}

async function checkWithAPI(files, gitInfo) {
  const payload = {
    projectId: parseInt(CONFIG.PROJECT_ID),
    files,
    branchName: gitInfo.branchName,
    authorEmail: gitInfo.authorEmail,
    commitMessage: 'Pre-commit check',
  };

  try {
    const response = await fetch(`${CONFIG.API_URL}/review/pre-commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    log(`\n❌ Failed to connect to AI Review backend: ${error.message}`, COLORS.red);
    log('Allowing commit to proceed (offline mode)', COLORS.yellow);
    return { passed: true, offline: true };
  }
}

async function main() {
  log('\n🔍 AI Code Review - Pre-commit Check', COLORS.bright + COLORS.blue);
  log('━'.repeat(50), COLORS.blue);

  // Get staged files
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    log('\n✓ No files to check', COLORS.green);
    return 0;
  }

  log(`\n📂 Checking ${stagedFiles.length} file(s)...`, COLORS.blue);
  stagedFiles.forEach((file) => log(`   • ${file}`, COLORS.reset));

  // Read file contents
  const files = stagedFiles
    .map((filePath) => ({
      path: filePath,
      content: getFileContent(filePath),
    }))
    .filter((f) => f.content !== null);

  if (files.length === 0) {
    log('\n⚠️  No readable files found', COLORS.yellow);
    return 0;
  }

  // Get Git info
  const gitInfo = getGitInfo();
  log(`\n🌿 Branch: ${gitInfo.branchName}`, COLORS.blue);
  log(`👤 Author: ${gitInfo.authorEmail}`, COLORS.blue);

  // Check with API
  log('\n⏳ Running mandatory rule checks...', COLORS.yellow);
  const result = await checkWithAPI(files, gitInfo);

  if (result.offline) {
    return 0;
  }

  // Display results
  log('\n' + '━'.repeat(50), COLORS.blue);

  if (result.passed) {
    log('\n✅ All checks passed! Commit allowed.', COLORS.green);
    log(`   Total findings: ${result.totalFindings}`, COLORS.green);
    log(`   Critical issues: ${result.criticalFindings}`, COLORS.green);
    return 0;
  } else {
    log('\n❌ Critical issues found! Commit blocked.', COLORS.red);
    log(`   Total findings: ${result.totalFindings}`, COLORS.red);
    log(`   Critical issues: ${result.criticalFindings}`, COLORS.red);

    if (result.findings && result.findings.length > 0) {
      log('\n📋 Issues:', COLORS.bright);
      const criticalFindings = result.findings.filter((f) => f.severity === 'critical');

      criticalFindings.forEach((finding, index) => {
        log(`\n   ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.title}`, COLORS.red);
        log(`      File: ${finding.file}:${finding.line_start}`, COLORS.reset);
        log(`      ${finding.explanation}`, COLORS.reset);
        log(`      💡 ${finding.recommendation}`, COLORS.yellow);
      });
    }

    log('\n' + '━'.repeat(50), COLORS.red);
    log('\n🚫 Please fix critical issues before committing.', COLORS.bright + COLORS.red);
    log('💡 Run "Quick Check" in the AI Review UI to see all details.\n', COLORS.yellow);

    return 1;
  }
}

// Run the hook
main()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    log(`\n❌ Unexpected error: ${error.message}`, COLORS.red);
    log('Allowing commit to proceed', COLORS.yellow);
    process.exit(0);
  });
