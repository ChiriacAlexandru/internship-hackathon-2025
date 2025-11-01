import pool from "../db/pool.js";

export const createCommitCheck = async ({
  projectId,
  commitHash,
  branchName,
  filesChecked = [],
  passed = false,
  totalFindings = 0,
  criticalFindings = 0,
  reviewId = null,
  authorEmail = null,
  commitMessage = null,
}) => {
  const { rows } = await pool.query(
    `
    INSERT INTO commit_checks (
      project_id, commit_hash, branch_name, files_checked,
      passed, total_findings, critical_findings, review_id,
      author_email, commit_message
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `,
    [
      projectId,
      commitHash,
      branchName,
      filesChecked,
      passed,
      totalFindings,
      criticalFindings,
      reviewId,
      authorEmail,
      commitMessage,
    ]
  );

  return rows[0];
};

export const listCommitChecksByProject = async (projectId, limit = 50) => {
  const { rows } = await pool.query(
    `
    SELECT 
      cc.*,
      r.summary as review_summary,
      COUNT(f.id) FILTER (WHERE f.severity = 'critical') as critical_count,
      COUNT(f.id) FILTER (WHERE f.severity = 'high') as high_count,
      COUNT(f.id) FILTER (WHERE f.severity = 'medium') as medium_count,
      COUNT(f.id) FILTER (WHERE f.severity = 'low') as low_count
    FROM commit_checks cc
    LEFT JOIN reviews r ON cc.review_id = r.id
    LEFT JOIN findings f ON r.id = f.review_id
    WHERE cc.project_id = $1
    GROUP BY cc.id, r.summary
    ORDER BY cc.created_at DESC
    LIMIT $2
  `,
    [projectId, limit]
  );

  return rows;
};

export const getCommitCheckById = async (id) => {
  const { rows } = await pool.query(
    `
    SELECT cc.*, r.summary as review_summary
    FROM commit_checks cc
    LEFT JOIN reviews r ON cc.review_id = r.id
    WHERE cc.id = $1
  `,
    [id]
  );

  return rows[0] ?? null;
};

export const getCommitCheckFindings = async (commitCheckId) => {
  const { rows } = await pool.query(
    `
    SELECT f.*
    FROM findings f
    JOIN reviews r ON f.review_id = r.id
    JOIN commit_checks cc ON r.id = cc.review_id
    WHERE cc.id = $1
    ORDER BY 
      CASE f.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      f.file, f.line_start
  `,
    [commitCheckId]
  );

  return rows;
};
