import { sql } from "./db";

export type Theme = "light" | "dark" | "system";

export type UserPreferences = {
  user_id: string;
  theme:   Theme;
};

export async function getUserPreferences(email: string): Promise<UserPreferences> {
  const rows = await sql`
    SELECT p.user_id, p.theme
    FROM user_preferences p
    JOIN users u ON p.user_id = u.id
    WHERE u.email = ${email}
  `;
  if (rows.length > 0) return rows[0] as UserPreferences;

  // No row yet — return default without inserting
  const userRows = await sql`SELECT id FROM users WHERE email = ${email}`;
  const user_id  = userRows[0]?.id ?? email; // fallback keeps the caller happy
  return { user_id, theme: "system" };
}

export async function isOnboardingCompleted(email: string): Promise<boolean> {
  const rows = await sql`
    SELECT p.onboarding_completed
    FROM user_preferences p
    JOIN users u ON p.user_id = u.id
    WHERE u.email = ${email}
  `;
  return (rows[0]?.onboarding_completed as boolean) ?? false;
}

export async function markOnboardingCompleted(email: string): Promise<void> {
  await sql`
    INSERT INTO user_preferences (user_id, onboarding_completed)
    SELECT id, TRUE FROM users WHERE email = ${email}
    ON CONFLICT (user_id) DO UPDATE
      SET onboarding_completed = TRUE, updated_at = NOW()
  `;
}

export async function upsertUserPreferences(
  email: string,
  theme: Theme
): Promise<void> {
  await sql`
    INSERT INTO user_preferences (user_id, theme)
    SELECT id, ${theme} FROM users WHERE email = ${email}
    ON CONFLICT (user_id) DO UPDATE
      SET theme = ${theme}, updated_at = NOW()
  `;
}
