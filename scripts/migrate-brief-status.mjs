import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  ALTER TABLE daily_brief_cache
    ADD COLUMN IF NOT EXISTS status          TEXT        NOT NULL DEFAULT 'idle',
    ADD COLUMN IF NOT EXISTS generating_since TIMESTAMPTZ
`;

console.log("Migration complete: status + generating_since added to daily_brief_cache.");
