import pool from "../db/pool.js";

export const upsertProjectRepoLink = async ({ projectId, userId, repoPath }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO project_repo_links (project_id, user_id, repo_path)
    VALUES ($1, $2, $3)
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET repo_path = EXCLUDED.repo_path, created_at = NOW()
    RETURNING id, project_id, user_id, repo_path, created_at
  `,
    [projectId, userId, repoPath],
  );

  return rows[0];
};

export const deleteProjectRepoLink = async ({ projectId, userId }) => {
  await pool.query(
    `
    DELETE FROM project_repo_links
    WHERE project_id = $1 AND user_id = $2
  `,
    [projectId, userId],
  );
};

export const listRepoLinksForUser = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT
      pr.project_id,
      pr.repo_path,
      pr.created_at,
      p.name AS project_name
    FROM project_repo_links pr
    JOIN projects p ON p.id = pr.project_id
    WHERE pr.user_id = $1
    ORDER BY p.name
  `,
    [userId],
  );

  return rows;
};
