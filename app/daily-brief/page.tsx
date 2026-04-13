import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BRIEF_TOPICS,
  getDailyBriefEntries,
  getDailyBriefCache,
  isCacheValid,
} from "@/lib/brief";
import { DailyBriefPanel } from "@/app/components/DailyBriefPanel";

export default async function DailyBriefPage() {
  const session = await auth();
  if (!session) redirect("/");

  // Fetch entries + cache for all topics in parallel
  const topicData = await Promise.all(
    BRIEF_TOPICS.map(async (topic) => {
      const [entries, cache] = await Promise.all([
        getDailyBriefEntries(topic),
        getDailyBriefCache(topic.key),
      ]);
      const articleIds  = entries.map((e) => String(e.id));
      const cacheHit    = cache && isCacheValid(cache, articleIds);
      return {
        topic,
        entries,
        articleIds,
        cachedContent:  cacheHit ? cache.content      : null,
        cachedDiff:     cacheHit ? cache.diff_summary  : null,
        cachedAt:       cacheHit ? cache.generated_at  : null,
        cachedHeadline: cacheHit ? cache.headline      : null,
      };
    })
  );

  return (
    <main className="min-h-[220vh] bg-white dark:bg-zinc-950 px-4 pt-10 pb-48">
      <div className="max-w-2xl mx-auto space-y-12">

        {topicData.map(({ topic, entries, cachedContent, cachedDiff, cachedAt, cachedHeadline }, idx) => (
          <section key={topic.key}>
            {/* Divider between topics */}
            {idx > 0 && (
              <hr className="mb-12 border-zinc-200 dark:border-zinc-800" />
            )}

            {/* Topic header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{topic.label}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topic.geoTags.map((tag) => (
                  <span key={tag} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
                {topic.topicTags.map((tag) => (
                  <span key={tag} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
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
                  {cachedContent && cachedAt && (
                    <span className="text-xs text-zinc-300 dark:text-zinc-600">
                      · cached {new Date(cachedAt).toLocaleString("en-GB", {
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </span>
                  )}
                </div>
                <DailyBriefPanel
                  topicKey={topic.key}
                  initialContent={cachedContent}
                  initialHeadline={cachedHeadline}
                  diffSummary={cachedDiff}
                />
              </>
            )}
          </section>
        ))}

      </div>
    </main>
  );
}
