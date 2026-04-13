import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getAllTags, getFeedEntries, PAGE_SIZE } from "@/lib/feed";
import { FeedEntryCard } from "./components/FeedEntryCard";
import { MiscToggle } from "./components/MiscToggle";
import { PageNav } from "./components/PageNav";
import { SynthesisPanel } from "./components/SynthesisPanel";
import { TagFilter } from "./components/TagFilter";
import { googleSignIn } from "./actions/auth";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; geo?: string | string[]; topic?: string | string[]; show_misc?: string }>;
}) {
  const session = await auth();

  if (!session) {
    return (
      <main className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-950 px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">BIG BANG</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            Geopolitical intelligence, synthesised from global news sources.
          </p>
          <form action={googleSignIn}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </form>
        </div>
      </main>
    );
  }

  const { page: pageParam, geo, topic, show_misc } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const selectedGeoTags = [geo ?? []].flat().filter(Boolean) as string[];
  const selectedTopicTags = [topic ?? []].flat().filter(Boolean) as string[];
  const showMisc = show_misc === "1";

  const [{ geoTags, topicTags }, { entries, total }] = await Promise.all([
    getAllTags(),
    getFeedEntries(page, selectedGeoTags, selectedTopicTags, showMisc),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">News Feed</h1>

        <Suspense>
          <TagFilter geoTags={geoTags} topicTags={topicTags} />
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

        {entries.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No articles found.</p>
        ) : (
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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
