import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { runMigrations } from "@/lib/migrate";
import { isOnboardingCompleted } from "@/lib/preferences";
import { OnboardingCarousel } from "@/app/components/OnboardingCarousel";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  await runMigrations();

  const completed = await isOnboardingCompleted(session.user.email);
  if (completed) redirect("/daily-brief");

  const name = session.user.name ?? session.user.email.split("@")[0];

  return <OnboardingCarousel userName={name} />;
}
