import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS feed_items (
      id        SERIAL PRIMARY KEY,
      guid      TEXT UNIQUE NOT NULL,
      title     TEXT,
      link      TEXT,
      pub_date  TIMESTAMPTZ,
      snippet   TEXT,
      synced_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
