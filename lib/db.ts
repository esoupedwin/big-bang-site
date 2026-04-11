import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS feed_entries (
      id          BIGSERIAL PRIMARY KEY,
      feed_name   TEXT NOT NULL,
      feed_url    TEXT NOT NULL,
      guid        TEXT UNIQUE NOT NULL,
      title       TEXT,
      link        TEXT,
      summary     TEXT,
      author      TEXT,
      published_at TIMESTAMPTZ,
      fetched_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
