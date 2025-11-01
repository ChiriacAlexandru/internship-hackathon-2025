import pool from "../db/pool.js";

export const createRule = async ({
  projectId,
  key,
  level,
  message,
  pattern,
  type,
  global = false,
}) => {
  const { rows } = await pool.query(
    `
    INSERT INTO rules (project_id, key, level, message, pattern, type, global)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, project_id, key, level, message, pattern, type, global, created_at
  `,
    [projectId ?? null, key, level ?? null, message ?? null, pattern ?? null, type ?? null, global],
  );

  return rows[0];
};

export const listAllRules = async () => {
  const { rows } = await pool.query(
    `
    SELECT id, project_id, key, level, message, pattern, type, global, created_at
    FROM rules
    ORDER BY created_at DESC
  `,
  );

  return rows;
};

export const listRulesForProject = async (projectId) => {
  const { rows } = await pool.query(
    `
    SELECT id, project_id, key, level, message, pattern, type, global, created_at
    FROM rules
    WHERE project_id = $1 OR global = true
    ORDER BY global DESC, created_at DESC
  `,
    [projectId],
  );

  return rows;
};
