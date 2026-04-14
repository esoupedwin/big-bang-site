import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// 1. Add user_id column (nullable for back-fill)
await sql`
  ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)
`;

// 2. Back-fill from users table
await sql`
  UPDATE user_preferences
  SET user_id = users.id
  FROM users
  WHERE user_preferences.user_email = users.email
`;

// 3. Make NOT NULL and set as primary key; drop old user_email PK
await sql`ALTER TABLE user_preferences ALTER COLUMN user_id SET NOT NULL`;
await sql`ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_pkey`;
await sql`ALTER TABLE user_preferences ADD PRIMARY KEY (user_id)`;
await sql`ALTER TABLE user_preferences DROP COLUMN user_email`;

console.log("user_preferences migrated to user_id.");

// 4. Show result
const rows = await sql`
  SELECT u.id, u.email, p.theme, p.created_at
  FROM user_preferences p
  JOIN users u ON p.user_id = u.id
  ORDER BY p.created_at
`;
rows.forEach(r => console.log(" ", r.id, r.email, r.theme));
