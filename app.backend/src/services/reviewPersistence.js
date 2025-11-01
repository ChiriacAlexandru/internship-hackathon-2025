import { createReviewRecord, createFindingRecord, recordUsage } from '../models/reviewModel.js';

export const persistReviewSession = async ({ metadata = {}, files = [], findings = [], usage }) => {
  if (process.env.BYPASS_DB === 'true') {
    return null;
  }

  try {
    const rawInput = JSON.stringify({ metadata, files }).slice(0, 10000);

    const review = await createReviewRecord({
      projectId: metadata.projectId ?? null,
      userId: metadata.userId ?? null,
      mode: metadata.mode ?? 'upload',
      rawInput,
      summary: metadata.summary ?? null,
    });

    for (const finding of findings) {
      await createFindingRecord(review.id, finding);
    }

    await recordUsage(review.id, usage);

    return review;
  } catch (error) {
    console.error('Failed to persist review session:', error.message);
    return null;
  }
};
