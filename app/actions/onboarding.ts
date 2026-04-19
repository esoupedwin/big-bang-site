"use server";

import { auth } from "@/lib/auth";
import { markOnboardingCompleted } from "@/lib/preferences";

export async function completeOnboardingAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) return;
  await markOnboardingCompleted(session.user.email);
}
