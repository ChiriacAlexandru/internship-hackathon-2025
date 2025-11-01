import pool from "../db/pool.js";

const ALLOWED_MEMBER_ROLES = new Set(["DEV", "PO"]);

export const addProjectMember = async ({ projectId, userId, roleInProject }) => {
  if (!ALLOWED_MEMBER_ROLES.has(roleInProject)) {
    throw new Error(`Invalid project member role: ${roleInProject}`);
  }

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

export const addProjectMembersBulk = async (projectId, members = []) => {
  const results = [];

  for (const member of members) {
    if (!member?.userId || !ALLOWED_MEMBER_ROLES.has(member.role)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const created = await addProjectMember({
      projectId,
      userId: member.userId,
      roleInProject: member.role,
    });

    results.push(created);
  }

  return results;
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

export const removeMembersByProject = async (projectId) => {
  await pool.query(
    `
    DELETE FROM projects_members
    WHERE project_id = $1
  `,
    [projectId],
  );
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

export const isUserMemberOfProject = async (projectId, userId) => {
  const { rows } = await pool.query(
    `
    SELECT 1
    FROM projects_members
    WHERE project_id = $1 AND user_id = $2
    LIMIT 1
  `,
    [projectId, userId],
  );

  return rows.length > 0;
};
