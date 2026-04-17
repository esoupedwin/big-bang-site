import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserIdByEmail } from "@/lib/coverages";
import { ACHIEVEMENTS, getUserAchievements } from "@/lib/achievements";

export default async function BadgesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const userId = await getUserIdByEmail(session.user.email);
  const earnedRows = userId ? await getUserAchievements(userId) : [];
  const earnedMap  = new Map(earnedRows.map((r) => [r.key, r.earned_at]));

  const earned    = ACHIEVEMENTS.filter((a) => earnedMap.has(a.key));
  const available = ACHIEVEMENTS.filter((a) => !earnedMap.has(a.key));

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Profile
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Badges</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {earned.length} of {ACHIEVEMENTS.length} earned
          </p>
        </div>

        {/* Earned */}
        {earned.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Earned
            </h2>
            <div className="space-y-2">
              {earned.map((a) => {
                const earnedAt = earnedMap.get(a.key)!;
                const date = new Date(earnedAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                });
                return (
                  <div
                    key={a.key}
                    className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-2xl select-none shadow-sm">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{a.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{a.description}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Earned {date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Available */}
        {available.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Available
            </h2>
            <div className="space-y-2">
              {available.map((a) => (
                <div
                  key={a.key}
                  className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 opacity-60"
                >
                  <div className="shrink-0 w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-2xl select-none grayscale">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{a.description}</p>
                  </div>
                  <div className="shrink-0 text-zinc-300 dark:text-zinc-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {ACHIEVEMENTS.length === 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No badges available yet.</p>
        )}
      </div>
    </main>
  );
}
