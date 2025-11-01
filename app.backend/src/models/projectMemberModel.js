import pool from "../db/pool.js";

export const addProjectMember = async ({ projectId, userId, roleInProject }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO projects_members (project_id, user_id, role_in_project)
    VALUES ($1, $2, $3)
    RETURNING id, project_id, user_id, role_in_project
  `,
    [projectId, userId, roleInProject],
  );

  return rows[0];
};

export const listMembersByProject = async (projectId) => {
  const { rows } = await pool.query(
    `
    SELECT pm.id, pm.project_id, pm.user_id, pm.role_in_project, u.display_name, u.email
    FROM projects_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = $1
    ORDER BY u.display_name
  `,
    [projectId],
  );

  return rows;
};

export const listProjectsByUser = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT pm.id, pm.project_id, pm.role_in_project, p.name, p.repo_path
    FROM projects_members pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.user_id = $1
    ORDER BY p.name
  `,
    [userId],
  );

  return rows;
};
