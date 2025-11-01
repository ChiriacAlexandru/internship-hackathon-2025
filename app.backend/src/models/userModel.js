import pool from "../db/pool.js";

export const createUser = async ({ email, passwordHash, displayName, role, repoPath = null }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO users (email, password_hash, display_name, role, repo_path)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, display_name, role, repo_path, created_at
  `,
    [email, passwordHash, displayName, role, repoPath],
  );

  return rows[0];
};

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `
    SELECT id, email, password_hash, display_name, role, repo_path, created_at
    FROM users
    WHERE email = $1
  `,
    [email],
  );

  return rows[0] ?? null;
};

export const findUserById = async (id) => {
  const { rows } = await pool.query(
    `
    SELECT id, email, display_name, role, repo_path, created_at
    FROM users
    WHERE id = $1
  `,
    [id],
  );

  return rows[0] ?? null;
};

export const listUsers = async () => {
  const { rows } = await pool.query(
    `
    SELECT id, email, display_name, role, repo_path, created_at
    FROM users
    ORDER BY created_at DESC
  `,
  );

  return rows;
};
