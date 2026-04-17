import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFeedEntries, PAGE_SIZE } from "@/lib/feed";
import { FeedEntryCard } from "../components/FeedEntryCard";
import { MiscToggle } from "../components/MiscToggle";
import { PageNav } from "../components/PageNav";
import { SynthesisPanel } from "../components/SynthesisPanel";
import { TagFilterAsync, TagFilterSkeleton } from "../components/TagFilterAsync";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; geo?: string | string[]; topic?: string | string[]; show_misc?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/");

  const { page: pageParam, geo, topic, show_misc } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const selectedGeoTags: string[] = geo ? (Array.isArray(geo) ? geo : [geo]) : [];
  const selectedTopicTags: string[] = topic ? (Array.isArray(topic) ? topic : [topic]) : [];
  const showMisc = show_misc === "1";

  const { entries, total } = await getFeedEntries(page, selectedGeoTags, selectedTopicTags, showMisc);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Explore</h1>

        <Suspense fallback={<TagFilterSkeleton />}>
          <TagFilterAsync />
        </Suspense>

        <div className="mt-4">
          <Suspense>
            <MiscToggle />
          </Suspense>
        </div>

        <SynthesisPanel
          entries={entries.map(({ title, summary, gist }) => ({ title, summary, gist }))}
          selectedGeoTags={selectedGeoTags}
          selectedTopicTags={selectedTopicTags}
        />

        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 mb-6">
          {total > 0 ? `${start}–${end} of ${total} articles` : "No articles found."}
        </p>

        {entries.length > 0 && (
          <>
            <PageNav
              page={currentPage}
              totalPages={totalPages}
              selectedGeoTags={selectedGeoTags}
              selectedTopicTags={selectedTopicTags}
              showMisc={showMisc}
            />

            <ol className="space-y-6 mt-8">
              {entries.map((entry) => (
                <FeedEntryCard key={entry.id} entry={entry} />
              ))}
            </ol>

            <div className="mt-10">
              <PageNav
                page={currentPage}
                totalPages={totalPages}
                selectedGeoTags={selectedGeoTags}
                selectedTopicTags={selectedTopicTags}
                showMisc={showMisc}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
