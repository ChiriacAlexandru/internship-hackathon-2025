import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import pool from "../db/pool.js";
import { ensureDatabase } from "../db/migrate.js";

dotenv.config();

const seedAdmin = async () => {
  if (process.env.BYPASS_DB === "true") {
    console.warn("BYPASS_DB=true detected. Set it to false before seeding users.");
    return;
  }

  await ensureDatabase();

  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin";
  const displayName = process.env.ADMIN_DISPLAY_NAME || "Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const query = `
    INSERT INTO users (email, password_hash, display_name, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role
    RETURNING id, email, display_name, role, created_at
  `;

  const { rows } = await pool.query(query, [email, passwordHash, displayName, "ADMIN"]);

  console.log("Admin user ready:", rows[0]);
};

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
