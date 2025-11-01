import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import pool from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getSqlPath = (filename) => path.join(__dirname, "..", "sql", filename);

const readSqlFile = async (filename) => {
  const filePath = getSqlPath(filename);
  const sql = await fs.readFile(filePath, "utf-8");
  return sql;
};

const executeStatements = async (sql, label) => {
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 80);
    console.log(`[db] Executing (${label}): ${preview}${preview.length === 80 ? "..." : ""}`);
    try {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(statement);
    } catch (error) {
      console.error(`[db] Statement failed (${label}): ${preview}`);
      throw error;
    }
  }
};

export const runMigrations = async () => {
  console.log("[db] Running migrations...");
  const sql = await readSqlFile("create_tables.sql");
  await executeStatements(sql, "migrate");
  console.log("[db] Migrations completed.");
};

export const runSeeds = async () => {
  try {
    console.log("[db] Seeding baseline data...");
    const sql = await readSqlFile("seed_rules.sql");
    await executeStatements(sql, "seed");
    console.log("[db] Seed step completed.");
  } catch (error) {
    console.warn("[db] Seed step skipped:", error.message);
  }
};

export const verifyDatabase = async () => {
  console.log("[db] Verifying database connectivity...");
  await pool.query("SELECT 1");
  console.log("[db] Database connection verified.");
};

export const ensureDatabase = async () => {
  await verifyDatabase();
  await runMigrations();
  await runSeeds();
};
