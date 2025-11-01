import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

const pool = new Pool(connectionConfig);

pool.on('error', (error) => {
  console.error('Unexpected PG error', error);
});

export default pool;
