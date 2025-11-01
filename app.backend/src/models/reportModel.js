import pool from "../db/pool.js";

export const createReport = async ({
  projectId,
  generatedBy,
  overallQuality,
  riskAreas,
  summary,
  timelineConfidence,
}) => {
  const { rows } = await pool.query(
    `
    INSERT INTO reports (
      project_id,
      generated_by,
      overall_quality,
      risk_areas,
      summary,
      timeline_confidence
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, project_id, generated_by, overall_quality, risk_areas, summary, timeline_confidence, created_at
  `,
    [
      projectId,
      generatedBy ?? null,
      overallQuality ?? null,
      riskAreas ?? null,
      summary ?? null,
      timelineConfidence ?? null,
    ],
  );

  return rows[0];
};

export const listReportsForProject = async (projectId) => {
  const { rows } = await pool.query(
    `
    SELECT id, project_id, generated_by, overall_quality, risk_areas, summary, timeline_confidence, created_at
    FROM reports
    WHERE project_id = $1
    ORDER BY created_at DESC
  `,
    [projectId],
  );

  return rows;
};
