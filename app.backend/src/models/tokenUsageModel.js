import pool from "../db/pool.js";

export const listUsageForReview = async (reviewId) => {
  const { rows } = await pool.query(
    `
    SELECT id, review_id, provider, model, chars_in, chars_out, latency_ms, created_at
    FROM token_usage
    WHERE review_id = $1
    ORDER BY created_at DESC
  `,
    [reviewId],
  );

  return rows;
};

export const listRecentUsage = async (limit = 25) => {
  const { rows } = await pool.query(
    `
    SELECT id, review_id, provider, model, chars_in, chars_out, latency_ms, created_at
    FROM token_usage
    ORDER BY created_at DESC
    LIMIT $1
  `,
    [limit],
  );

  return rows;
};
