import pool from "../db/pool.js";

export const createProject = async ({ name, repoPath, createdBy }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO projects (name, repo_path, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, name, repo_path, created_by, created_at
  `,
    [name, repoPath ?? null, createdBy],
  );

  return rows[0];
};

export const findProjectById = async (id) => {
  const { rows } = await pool.query(
    `
    SELECT id, name, repo_path, created_by, created_at
    FROM projects
    WHERE id = $1
  `,
    [id],
  );

  return rows[0] ?? null;
};

export const listProjectsWithMembers = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.repo_path,
      p.created_by,
      p.created_at,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'memberId', pm.user_id,
              'role', pm.role_in_project,
              'displayName', u.display_name,
              'email', u.email
            )
          )
          FROM projects_members pm
          JOIN users u ON u.id = pm.user_id
          WHERE pm.project_id = p.id
        ),
        '[]'::JSON
      ) AS members,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', r.id,
              'key', r.key,
              'level', r.level,
              'message', r.message,
              'pattern', r.pattern,
              'type', r.type,
              'global', r.global,
              'created_at', r.created_at
            )
          )
          FROM rules r
          WHERE r.project_id = p.id
        ),
        '[]'::JSON
      ) AS rules
    FROM projects p
    ORDER BY p.created_at DESC
  `,
  );

  return rows;
};

export const listProjectsForUser = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.repo_path,
      p.created_by,
      p.created_at,
      pm.role_in_project AS member_role,
      (
        SELECT COUNT(*)
        FROM rules r
        WHERE r.project_id = p.id
      ) AS rule_count
    FROM projects p
    JOIN projects_members pm ON pm.project_id = p.id
    WHERE pm.user_id = $1
    ORDER BY p.created_at DESC
  `,
    [userId],
  );

  return rows;
};

export const getProjectWithMembers = async (id) => {
  const { rows } = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.repo_path,
      p.created_by,
      p.created_at,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'memberId', pm.user_id,
              'role', pm.role_in_project,
              'displayName', u.display_name,
              'email', u.email
            )
          )
          FROM projects_members pm
          JOIN users u ON u.id = pm.user_id
          WHERE pm.project_id = p.id
        ),
        '[]'::JSON
      ) AS members,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', r.id,
              'key', r.key,
              'level', r.level,
              'message', r.message,
              'pattern', r.pattern,
              'type', r.type,
              'global', r.global,
              'created_at', r.created_at
            )
          )
          FROM rules r
          WHERE r.project_id = p.id
        ),
        '[]'::JSON
      ) AS rules
    FROM projects p
    WHERE p.id = $1
  `,
    [id],
  );

  return rows[0] ?? null;
};
