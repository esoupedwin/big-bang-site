"use server";

import { auth } from "@/lib/auth";
import {
  getUserIdByEmail,
  initializeUserCoverages,
  addUserCoverage,
  updateUserCoverage,
  removeUserCoverage,
} from "@/lib/coverages";
import { revalidatePath } from "next/cache";

export async function addCoverageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return;

  const label      = (formData.get("label")      as string)?.trim();
  const geoTags    = formData.getAll("geoTags")   as string[];
  const topicTags  = formData.getAll("topicTags") as string[];
  const priorities = (formData.get("priorities")  as string)?.trim() || null;

  if (!label || topicTags.length === 0) return;

  await initializeUserCoverages(userId);
  await addUserCoverage(userId, label, geoTags, topicTags, priorities);
  revalidatePath("/profile/coverages");
  revalidatePath("/daily-brief");
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
