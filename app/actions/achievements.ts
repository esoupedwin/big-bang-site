"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getUserIdByEmail } from "@/lib/coverages";
import { awardAchievement, type Achievement } from "@/lib/achievements";
import { sql } from "@/lib/db";

export async function awardAchievementAction(key: string): Promise<Achievement | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return null;

  const earned = await awardAchievement(userId, key);
  if (earned) revalidatePath("/profile/badges");
  return earned;
}

export async function trackArticleClickAction(): Promise<Achievement | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId) return null;

    const rows = await sql`
      INSERT INTO user_stats (user_id, stat_key, value)
      VALUES (${userId}, 'article_clicks', 1)
      ON CONFLICT (user_id, stat_key) DO UPDATE
        SET value = user_stats.value + 1
      RETURNING value
    `;

    const count = rows[0]?.value as number;
    if (count >= 5) {
      const earned = await awardAchievement(userId, "news_scanner");
      if (earned) revalidatePath("/profile/badges");
      return earned;
    }
    return null;
  } catch {
    return null;
  }
}
