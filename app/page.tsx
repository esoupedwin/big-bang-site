import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getFeedEntries, PAGE_SIZE } from "@/lib/feed";
import { FeedEntryCard } from "./components/FeedEntryCard";
import { MiscToggle } from "./components/MiscToggle";
import { PageNav } from "./components/PageNav";
import { SynthesisPanel } from "./components/SynthesisPanel";
import { TagFilterAsync, TagFilterSkeleton } from "./components/TagFilterAsync";
import { googleSignIn } from "./actions/auth";
import { AsciiAnimation } from "./components/AsciiAnimation";
import { GoogleIcon } from "./components/GoogleIcon";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; geo?: string | string[]; topic?: string | string[]; show_misc?: string }>;
}) {
  const session = await auth();

  if (!session) {
    return (
      <main className="relative flex-1 overflow-hidden bg-white dark:bg-zinc-950">
        <AsciiAnimation />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <h1 className="text-5xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
              BIG BANG
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">
              Geopolitical intelligence, synthesised from global news sources.
            </p>
            <form action={googleSignIn}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-black border border-zinc-700 rounded-lg hover:bg-zinc-900 transition-colors shadow-sm"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

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
