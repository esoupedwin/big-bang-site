import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDailyBriefEntries, getDailyBriefCache } from "@/lib/brief";
import { getUserIdByEmail, getUserCoverages, initializeUserCoverages, userCoverageToBriefTopic } from "@/lib/coverages";
import { runMigrations } from "@/lib/migrate";
import { DailyBriefCarousel } from "@/app/components/DailyBriefCarousel";

export default async function DailyBriefPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  await runMigrations();

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) redirect("/");

  await initializeUserCoverages(userId);
  const coverages = await getUserCoverages(userId);
  const topics    = coverages.map(userCoverageToBriefTopic);

  // Fetch entries (for article count) + cache (for stale content) in parallel.
  // Cache validity is intentionally NOT checked here — the trigger endpoint
  // handles that and starts background regeneration when needed.
  const slides = await Promise.all(
    topics.map(async (topic) => {
      const [entries, cache] = await Promise.all([
        getDailyBriefEntries(topic),
        getDailyBriefCache(topic.key),
      ]);
      return {
        topicKey:       topic.key,
        label:          topic.label,
        geoTags:        topic.geoTags,
        topicTags:      topic.topicTags,
        articleCount:   entries.length,
        articles:       entries.map((e) => ({
          title:       e.title,
          link:        e.link,
          feedName:    e.feed_name,
          publishedAt: e.published_at,
          geoTags:     e.geo_tags,
          topicTags:   e.topic_tags,
        })),
        cachedContent:  cache?.content      ?? null,
        cachedDiff:     cache?.diff_summary  ?? null,
        cachedAt:       cache?.generated_at  ?? null,
        cachedHeadline: cache?.headline      ?? null,
      };
    })
  );

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <DailyBriefCarousel slides={slides} />
    </main>
  );
}
