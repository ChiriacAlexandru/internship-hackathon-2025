import {
  listCommitChecksByProject,
  getCommitCheckById,
  getCommitCheckFindings,
  createCommitCheck,
} from '../models/commitCheckModel.js';
import { runRuleChecks } from '../services/ruleEngine.js';
import { runReviewWithModel } from '../services/ollamaSvc.js';
import { recordUsageMetrics } from '../services/costTracker.js';
import { persistReviewSession } from '../services/reviewPersistence.js';

export const handleListCommitChecks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const checks = await listCommitChecksByProject(projectId, limit);

    res.json({ checks });
  } catch (error) {
    next(error);
  }
};

export const handleGetCommitCheck = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await getCommitCheckById(id);
    if (!check) {
      return res.status(404).json({ error: 'Commit check not found' });
    }

    const findings = await getCommitCheckFindings(id);

    res.json({
      check,
      findings,
    });
  } catch (error) {
    next(error);
  }
};

// Endpoint called by pre-commit hook
export const handlePreCommitCheck = async (req, res, next) => {
  try {
    const {
      projectId,
      files = [],
      commitHash = null,
      branchName = null,
      authorEmail = null,
      commitMessage = null,
    } = req.body ?? {};

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'files array is required and must contain at least one file',
      });
    }

    // Run rule checks
    const ruleFindings = await runRuleChecks(files, { projectId });

    // Count critical findings
    const criticalFindings = ruleFindings.filter(
      (f) => f.severity === 'critical'
    ).length;

    const totalFindings = ruleFindings.length;
    const passed = criticalFindings === 0;

    // Create review record
    const persisted = await persistReviewSession({
      metadata: {
        projectId,
        userId: req.user?.id ?? null,
        mode: 'pre-commit',
      },
      files,
      findings: ruleFindings,
      usage: null,
    });

    // Create commit check record
    const commitCheck = await createCommitCheck({
      projectId,
      commitHash,
      branchName,
      filesChecked: files.map((f) => f.path),
      passed,
      totalFindings,
      criticalFindings,
      reviewId: persisted?.id ?? null,
      authorEmail,
      commitMessage,
    });

    res.json({
      passed,
      commitCheckId: commitCheck.id,
      totalFindings,
      criticalFindings,
      findings: ruleFindings,
      message: passed
        ? 'All mandatory checks passed! Commit allowed.'
        : `Found ${criticalFindings} critical issue(s). Fix them before committing.`,
    });
  } catch (error) {
    console.error('Pre-commit check failed:', error);
    next(error);
  }
};
