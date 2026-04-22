"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import {
  upsertUserPreferences,
  upsertAudioBriefPreferences,
  type Theme,
  type AudioBriefGender,
  type AudioBriefTone,
} from "@/lib/preferences";

export async function saveTheme(theme: Theme) {
  const session = await auth();
  if (!session?.user?.email) return;

  await upsertUserPreferences(session.user.email, theme);

  // Persist to cookie so the layout can apply the class on the next SSR request
  const jar = await cookies();
  jar.set("theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  revalidatePath("/", "layout");
}

export async function saveAudioBriefPreferences(gender: AudioBriefGender, tone: AudioBriefTone) {
  const session = await auth();
  if (!session?.user?.email) return;

  await upsertAudioBriefPreferences(session.user.email, gender, tone);
  revalidatePath("/profile");
}
