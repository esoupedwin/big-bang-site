import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAllTags } from "@/lib/feed";
import { getUserIdByEmail, getUserCoverages, initializeUserCoverages } from "@/lib/coverages";
import { runMigrations } from "@/lib/migrate";
import { CoverageSettingsClient } from "@/app/components/CoverageSettingsClient";

export default async function CoveragesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  await runMigrations();

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) redirect("/");

  await initializeUserCoverages(userId);
  const [coverages, { geoTags, topicTags }] = await Promise.all([
    getUserCoverages(userId),
    getAllTags(),
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to profile
        </Link>

        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">User Preferences: Daily Brief Coverages</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Choose what to track on your Daily Brief page.
          </p>
        </div>

        <CoverageSettingsClient
          coverages={coverages}
          geoTags={geoTags}
          topicTags={topicTags}
        />
      </div>
    </main>
  );
}
