import { sql } from "./db";

export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const rows = await sql`
    SELECT 1 FROM admins a
    JOIN users u ON a.user_id = u.id
    WHERE u.email = ${email}
  `;
  return rows.length > 0;
}
