import { runRuleChecks } from "../services/ruleEngine.js";
import { runReviewWithModel } from "../services/ollamaSvc.js";
import { recordUsageMetrics } from "../services/costTracker.js";
import { persistReviewSession } from "../services/reviewPersistence.js";

export const handleCreateReview = async (req, res, next) => {
  try {
    const { files = [], metadata = {} } = req.body ?? {};

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error:
          "Payload must include a non-empty `files` array with {path, content}.",
      });
    }

    const ruleFindings = await runRuleChecks(files, {
      projectId: metadata.projectId,
    });
    const { findings: modelFindings, usage } = await runReviewWithModel(
      files,
      metadata
    );

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

export const handleQuickCheck = async (req, res, next) => {
  try {
    const { files = [], projectId } = req.body ?? {};

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error:
          "Payload must include a non-empty `files` array with {path, content}.",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        error: "projectId is required for quick check.",
      });
    }

    const ruleFindings = await runRuleChecks(files, { projectId });

    const passed = ruleFindings.length === 0;

    res.json({
      passed,
      violations: ruleFindings,
      message: passed
        ? "All mandatory rules passed!"
        : `Found ${ruleFindings.length} violation${
            ruleFindings.length > 1 ? "s" : ""
          }.`,
    });
  } catch (error) {
    next(error);
  }
};
