"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getUserIdByEmail } from "@/lib/coverages";
import { awardAchievement, type Achievement } from "@/lib/achievements";

export async function awardAchievementAction(key: string): Promise<Achievement | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return null;

  const earned = await awardAchievement(userId, key);
  if (earned) revalidatePath("/profile/badges");
  return earned;
}
