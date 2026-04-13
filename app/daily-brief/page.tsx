import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getDailyBriefEntries,
  getDailyBriefCache,
  isCacheValid,
  DAILY_BRIEF_GEO,
  DAILY_BRIEF_TOPIC,
  DAILY_BRIEF_TOPIC_KEY,
} from "@/lib/brief";
import { DailyBriefPanel } from "@/app/components/DailyBriefPanel";

export default async function DailyBriefPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [entries, cache] = await Promise.all([
    getDailyBriefEntries(),
    getDailyBriefCache(DAILY_BRIEF_TOPIC_KEY),
  ]);

  const articleIds = entries.map((e) => String(e.id));
  const cachedContent =
    cache && isCacheValid(cache, articleIds) ? cache.content : null;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Daily Brief</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            US · Iran · Israel — last 24 hours
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {DAILY_BRIEF_GEO.map((tag) => (
            <span key={tag} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {DAILY_BRIEF_TOPIC.map((tag) => (
            <span key={tag} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No articles found in the last 24 hours for this topic.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Based on {entries.length} article{entries.length !== 1 ? "s" : ""} from the last 24 hours
              </p>
              {cachedContent && (
                <span className="text-xs text-zinc-300 dark:text-zinc-600">· cached</span>
              )}
            </div>
            <DailyBriefPanel initialContent={cachedContent} />
          </>
        )}

      </div>
    </main>
  );
}
