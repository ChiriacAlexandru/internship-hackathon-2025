import pool from "../db/pool.js";

export const createProject = async ({ name, repoPath, createdBy }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO projects (name, repo_path, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, name, repo_path, created_by, created_at
  `,
    [name, repoPath ?? null, createdBy ?? null],
  );

  return rows[0];
};

export const listProjects = async () => {
  const { rows } = await pool.query(
    `
    SELECT id, name, repo_path, created_by, created_at
    FROM projects
    ORDER BY created_at DESC
  `,
  );

  return rows;
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
