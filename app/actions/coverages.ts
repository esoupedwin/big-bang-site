"use server";

import { auth } from "@/lib/auth";
import {
  getUserIdByEmail,
  initializeUserCoverages,
  addUserCoverage,
  updateUserCoverage,
  removeUserCoverage,
} from "@/lib/coverages";
import { awardAchievement, type Achievement } from "@/lib/achievements";
import { revalidatePath } from "next/cache";

export async function addCoverageAction(formData: FormData): Promise<Achievement | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return null;

  const label      = (formData.get("label")      as string)?.trim();
  const geoTags    = formData.getAll("geoTags")   as string[];
  const topicTags  = formData.getAll("topicTags") as string[];
  const priorities = (formData.get("priorities")  as string)?.trim() || null;

  if (!label || topicTags.length === 0) return null;

  await initializeUserCoverages(userId);
  await addUserCoverage(userId, label, geoTags, topicTags, priorities);

  const earned = await awardAchievement(userId, "coverage_master");

  revalidatePath("/profile/coverages");
  revalidatePath("/daily-brief");

  return earned;
}

export async function updateCoverageAction(coverageId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return;

  const label      = (formData.get("label")      as string)?.trim();
  const geoTags    = formData.getAll("geoTags")   as string[];
  const topicTags  = formData.getAll("topicTags") as string[];
  const priorities = (formData.get("priorities")  as string)?.trim() || null;

  if (!label || topicTags.length === 0) return;

  await updateUserCoverage(userId, coverageId, label, geoTags, topicTags, priorities);
  revalidatePath("/profile/coverages");
  revalidatePath("/daily-brief");
}

export async function removeCoverageAction(coverageId: string) {
  const session = await auth();
  if (!session?.user?.email) return;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return;

  await removeUserCoverage(userId, coverageId);
  revalidatePath("/profile/coverages");
  revalidatePath("/daily-brief");
}
