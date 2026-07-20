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


// Handle unexpected database connection errors
pool.on("error", (err) => {
  console.error(
    "POSTGRES POOL ERROR:",
    err.message
  );
});


async function runQuery<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {

  const result = await pool.query(
    text,
    params
  );

  return result.rows as T[];
}



export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {

  try {

    return await runQuery<T>(
      text,
      params
    );

  } catch (error: any) {

    console.error(
      "DATABASE QUERY FAILED:",
      error.message
    );


    // Retry once for temporary Neon connection issues
    const retryErrors = [
      "timeout",
      "terminated",
      "ECONNRESET",
      "connection"
    ];


    const shouldRetry = retryErrors.some(
      (msg) =>
        error.message
          ?.toLowerCase()
          .includes(msg.toLowerCase())
    );


    if (shouldRetry) {

      console.log(
        "Retrying database connection..."
      );


      await new Promise(
        (resolve) => setTimeout(resolve, 1000)
      );


      return await runQuery<T>(
        text,
        params
      );
    }


    throw error;
  }
}



export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {

  const rows = await query<T>(
    text,
    params
  );

  return rows[0] ?? null;

}