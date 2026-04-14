import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BRIEF_TOPICS, getDailyBriefEntries, getDailyBriefCache } from "@/lib/brief";
import { DailyBriefPanel } from "@/app/components/DailyBriefPanel";

export default async function DailyBriefPage() {
  const session = await auth();
  if (!session) redirect("/");

  // Fetch entries (for article count) + cache (for stale content) in parallel.
  // Cache validity is intentionally NOT checked here — the trigger endpoint
  // handles that and starts background regeneration when needed.
  const topicData = await Promise.all(
    BRIEF_TOPICS.map(async (topic) => {
      const [entries, cache] = await Promise.all([
        getDailyBriefEntries(topic),
        getDailyBriefCache(topic.key),
      ]);
      return {
        topic,
        articleCount:   entries.length,
        articles:       entries.map((e) => ({
          title:       e.title,
          link:        e.link,
          feedName:    e.feed_name,
          publishedAt: e.published_at,
        })),
        cachedContent:  cache?.content      ?? null,
        cachedDiff:     cache?.diff_summary  ?? null,
        cachedAt:       cache?.generated_at  ?? null,
        cachedHeadline: cache?.headline      ?? null,
      };
    })
  );

  return (
    <main className="min-h-[220vh] bg-white dark:bg-zinc-950 px-4 pt-10 pb-48">
      <div className="max-w-2xl mx-auto space-y-12">

        {topicData.map(({ topic, articleCount, articles, cachedContent, cachedDiff, cachedAt, cachedHeadline }, idx) => (
          <section key={topic.key}>
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

            {articleCount === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No articles found in the last 24 hours for this topic.
              </p>
            ) : (
              <DailyBriefPanel
                topicKey={topic.key}
                cachedContent={cachedContent}
                cachedHeadline={cachedHeadline}
                cachedDiff={cachedDiff}
                cachedAt={cachedAt}
                articleCount={articleCount}
                articles={articles}
              />
            )}
          </section>
        ))}

      </div>
    </main>
  );
}
