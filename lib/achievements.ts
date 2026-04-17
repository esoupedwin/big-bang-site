import { sql } from "./db";

export type Achievement = {
  key:         string;
  title:       string;
  description: string;
  icon:        string; // emoji
};

/** Master list — add new achievements here. */
export const ACHIEVEMENTS: Achievement[] = [
  {
    key:         "coverage_master",
    title:       "Coverage Master",
    description: "Created your first coverage",
    icon:        "🗺️",
  },
  {
    key:         "synthesize_master",
    title:       "Synthesize Master",
    description: "Used the Synthesize feature on the Explore page",
    icon:        "🧠",
  },
];

/** Returns the Achievement if it was newly awarded, null if already held. */
export async function awardAchievement(
  userId: string,
  key: string
): Promise<Achievement | null> {
  const result = await sql`
    INSERT INTO user_achievements (user_id, achievement_key)
    VALUES (${userId}, ${key})
    ON CONFLICT (user_id, achievement_key) DO NOTHING
    RETURNING id
  `;
  if (!result.length) return null;
  return ACHIEVEMENTS.find((a) => a.key === key) ?? null;
}

/** Returns the keys of all achievements the user has earned. */
export async function getUserAchievementKeys(userId: string): Promise<string[]> {
  const rows = await sql`
    SELECT achievement_key, earned_at
    FROM user_achievements
    WHERE user_id = ${userId}
    ORDER BY earned_at ASC
  `;
  return rows.map((r) => r.achievement_key as string);
}

/** Returns earned achievements with their earn timestamps. */
export async function getUserAchievements(
  userId: string
): Promise<{ key: string; earned_at: string }[]> {
  const rows = await sql`
    SELECT achievement_key, earned_at
    FROM user_achievements
    WHERE user_id = ${userId}
    ORDER BY earned_at ASC
  `;
  return rows as { key: string; earned_at: string }[];
}
