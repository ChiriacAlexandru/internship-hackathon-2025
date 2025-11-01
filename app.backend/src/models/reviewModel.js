import pool from '../db/pool.js';

export const createReviewRecord = async ({
  projectId = null,
  userId = null,
  mode = 'upload',
  rawInput = null,
  summary = null,
}) => {
  const { rows } = await pool.query(
    `
    INSERT INTO reviews (project_id, user_id, mode, raw_input, summary)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, project_id, user_id, mode, summary, created_at
  `,
    [projectId, userId, mode, rawInput, summary],
  );

  return rows[0];
};

export const findReviewById = async (id) => {
  const { rows } = await pool.query(
    `
    SELECT id, project_id, user_id, mode, summary, created_at
    FROM reviews
    WHERE id = $1
  `,
    [id],
  );

  return rows[0] ?? null;
};

export const listReviewsByProject = async (projectId) => {
  const { rows } = await pool.query(
    `
    SELECT id, project_id, user_id, mode, summary, created_at
    FROM reviews
    WHERE project_id = $1
    ORDER BY created_at DESC
  `,
    [projectId],
  );

  return rows;
};

export const createFindingRecord = async (reviewId, finding) => {
  const {
    file,
    line_start,
    line_end,
    category,
    severity,
    title,
    explanation,
    recommendation,
    effort_minutes,
    autofix_patch,
    source,
  } = finding;

  const { rows } = await pool.query(
    `
    INSERT INTO findings (
      review_id, file, line_start, line_end, category, severity,
      title, explanation, recommendation, effort_min, autofix_patch, source
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `,
    [
      reviewId,
      file ?? null,
      line_start ?? null,
      line_end ?? null,
      category ?? null,
      severity ?? null,
      title ?? null,
      explanation ?? null,
      recommendation ?? null,
      effort_minutes ?? null,
      autofix_patch ?? null,
      source ?? 'ai',
    ],
  );

  return rows[0];
};

export const recordUsage = async (reviewId, usage) => {
  if (!usage) return null;

  const { provider, model, chars_in, chars_out, latency_ms } = usage;

  const { rows } = await pool.query(
    `
    INSERT INTO token_usage (review_id, provider, model, chars_in, chars_out, latency_ms)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `,
    [reviewId, provider ?? null, model ?? null, chars_in ?? 0, chars_out ?? 0, latency_ms ?? 0],
  );

  return rows[0];
};
