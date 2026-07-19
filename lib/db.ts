import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it in your Vercel project's Environment Variables (or .env.local for local dev)."
    );
  }

 return new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
}

// Reuse the pool across hot-reloads in dev / across invocations on Vercel.
const pool = global.__pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await pool.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("DATABASE ERROR:", error);
    console.error("FAILED QUERY:", text);
    console.error("PARAMS:", params);
    throw error;
  }
}

export async function queryOne<T = any>(
  text: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export default pool;