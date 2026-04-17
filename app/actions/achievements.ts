"use server";

import { auth } from "@/lib/auth";
import { getUserIdByEmail } from "@/lib/coverages";
import { awardAchievement, type Achievement } from "@/lib/achievements";

export async function awardAchievementAction(key: string): Promise<Achievement | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return null;

  return awardAchievement(userId, key);
}
