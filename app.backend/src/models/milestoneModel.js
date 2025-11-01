import pool from "../db/pool.js";

export const createMilestone = async ({
  projectId,
  title,
  plannedDate,
  status = "planned",
  notes,
}) => {
  const { rows } = await pool.query(
    `
    INSERT INTO milestones (project_id, title, planned_date, status, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, project_id, title, planned_date, status, notes, created_at
  `,
    [projectId, title, plannedDate ?? null, status, notes ?? null],
  );

  return rows[0];
};

export const listMilestonesForProject = async (projectId) => {
  const { rows } = await pool.query(
    `
    SELECT id, project_id, title, planned_date, status, notes, created_at
    FROM milestones
    WHERE project_id = $1
    ORDER BY planned_date NULLS LAST, created_at DESC
  `,
    [projectId],
  );

  return rows;
};
