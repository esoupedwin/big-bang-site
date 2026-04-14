import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// 1. Create users table
await sql`
  CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;
console.log("users table ready.");

// 2. Seed from all known emails (user_preferences + admins)
await sql`
  INSERT INTO users (email)
  SELECT DISTINCT user_email FROM user_preferences
  UNION
  SELECT email FROM admins
  ON CONFLICT (email) DO NOTHING
`;
console.log("users seeded from existing records.");

// 3. Add user_id column to admins (nullable first so we can back-fill)
await sql`
  ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)
`;

// 4. Back-fill user_id from users table
await sql`
  UPDATE admins
  SET user_id = users.id
  FROM users
  WHERE admins.email = users.email
`;

// 5. Make user_id NOT NULL and the new primary key; drop the old email PK
await sql`ALTER TABLE admins ALTER COLUMN user_id SET NOT NULL`;
await sql`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_pkey`;
await sql`ALTER TABLE admins ADD PRIMARY KEY (user_id)`;
await sql`ALTER TABLE admins DROP COLUMN email`;

console.log("admins migrated to user_id.");

// 6. Show the result
const users  = await sql`SELECT id, email, created_at FROM users ORDER BY created_at`;
const admins = await sql`
  SELECT u.id, u.email FROM admins a JOIN users u ON a.user_id = u.id
`;
console.log("\nusers:");
users.forEach(u => console.log(" ", u.id, u.email));
console.log("\nadmins:");
admins.forEach(a => console.log(" ", a.id, a.email));
