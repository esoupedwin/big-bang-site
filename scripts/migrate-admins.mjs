import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS admins (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  INSERT INTO admins (email)
  VALUES ('edwinang.email@gmail.com')
  ON CONFLICT (email) DO NOTHING
`;

console.log("admins table created and seeded.");
