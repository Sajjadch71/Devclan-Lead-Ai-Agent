// Run once to create all tables: `npm run db:init`
// Reads DATABASE_URL from .env.local automatically if present.
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";

// Minimal .env.local loader (avoids needing an extra dependency).
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // no .env.local, that's fine — assume env vars are already set (e.g. on Vercel)
  }
}

loadEnvLocal();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local (locally) or your Vercel project's Environment Variables."
  );
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "lib", "schema.sql");
const schema = readFileSync(schemaPath, "utf-8");

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

try {
  await pool.query(schema);
  console.log("✔ Database schema created successfully.");
} catch (err) {
  console.error("✘ Failed to create schema:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
