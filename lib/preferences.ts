import { sql } from "./db";

export type Theme = "light" | "dark" | "system";

export type UserPreferences = {
  user_email: string;
  theme: Theme;
};

export async function getUserPreferences(email: string): Promise<UserPreferences> {
  const rows = await sql`
    SELECT user_email, theme
    FROM user_preferences
    WHERE user_email = ${email}
  `;
  if (rows.length > 0) {
    return rows[0] as UserPreferences;
  }
  return { user_email: email, theme: "system" };
}

export async function upsertUserPreferences(
  email: string,
  theme: Theme
): Promise<void> {
  await sql`
    INSERT INTO user_preferences (user_email, theme)
    VALUES (${email}, ${theme})
    ON CONFLICT (user_email) DO UPDATE
      SET theme = ${theme}, updated_at = NOW()
  `;
}
