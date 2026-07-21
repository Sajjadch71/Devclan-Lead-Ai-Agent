import { Pool } from "pg";

const globalForPg = global as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForPg.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    ssl: {
      rejectUnauthorized: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool;
}

pool.on("error", (err) => {
  console.error("POSTGRES POOL ERROR:", err.message);
});

async function runQuery<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  try {
    return await runQuery<T>(text, params);
  } catch (error: any) {
    console.error("DATABASE QUERY ERROR:", error.message);

    const retry =
      error.code === "ECONNRESET" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("timeout") ||
      error.message?.includes("terminated");

    if (retry) {
      console.log("Retrying database query...");

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      return await runQuery<T>(text, params);
    }

    throw error;
  }
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}