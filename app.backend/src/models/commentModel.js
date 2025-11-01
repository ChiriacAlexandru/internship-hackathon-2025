import pool from "../db/pool.js";

export const addComment = async ({ findingId, authorId, body }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO comments (finding_id, author_id, body)
    VALUES ($1, $2, $3)
    RETURNING id, finding_id, author_id, body, created_at
  `,
    [findingId, authorId, body],
  );

  return rows[0];
};

export const listCommentsForFinding = async (findingId) => {
  const { rows } = await pool.query(
    `
    SELECT c.id, c.finding_id, c.author_id, c.body, c.created_at, u.display_name
    FROM comments c
    LEFT JOIN users u ON u.id = c.author_id
    WHERE c.finding_id = $1
    ORDER BY c.created_at ASC
  `,
    [findingId],
  );

  return rows;
};
