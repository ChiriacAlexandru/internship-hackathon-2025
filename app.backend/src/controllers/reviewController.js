import { runRuleChecks } from '../services/ruleEngine.js';
import { runReviewWithModel } from '../services/ollamaSvc.js';
import { recordUsageMetrics } from '../services/costTracker.js';
import { persistReviewSession } from '../services/reviewPersistence.js';

export const handleCreateReview = async (req, res, next) => {
  try {
    const { files = [], metadata = {} } = req.body ?? {};

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'Payload must include a non-empty `files` array with {path, content}.',
      });
    }

    const ruleFindings = runRuleChecks(files);
    const { findings: modelFindings, usage } = await runReviewWithModel(files, metadata);

    recordUsageMetrics(usage);

    const combinedFindings = [...ruleFindings, ...modelFindings];

    const persisted = await persistReviewSession({
      metadata,
      files,
      findings: combinedFindings,
      usage,
    });

    res.status(201).json({
      review: {
        id: persisted?.id,
        metadata,
        findings: combinedFindings,
        usage,
      },
    });
  } catch (error) {
    next(error);
  }
};
