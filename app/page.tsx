import { sql } from "@/lib/db";
import Link from "next/link";

const PAGE_SIZE = 50;

type FeedEntry = {
  id: string;
  feed_name: string;
  title: string | null;
  link: string | null;
  summary: string | null;
  author: string | null;
  published_at: string | null;
  tags: string[] | null;
};

function PageNav({ page, totalPages }: { page: number; totalPages: number }) {
  return (
    <div className="flex items-center justify-between">
      {page > 1 ? (
        <Link
          href={`/?page=${page - 1}`}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={`/?page=${page + 1}`}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

async function getFeedEntries(page: number): Promise<{ entries: FeedEntry[]; total: number }> {
  const offset = (page - 1) * PAGE_SIZE;
  const [entries, countResult] = await Promise.all([
    sql`
      SELECT id, feed_name, title, link, summary, author, published_at, tags
      FROM feed_entries
      ORDER BY published_at DESC NULLS LAST
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql`SELECT COUNT(*) FROM feed_entries`,
  ]);
  return {
    entries: entries as FeedEntry[],
    total: Number((countResult[0] as { count: string }).count),
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { entries, total } = await getFeedEntries(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const clampedPage = Math.min(page, totalPages || 1);

  const start = (clampedPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(clampedPage * PAGE_SIZE, total);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">News Feed</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          {total > 0 ? `${start}–${end} of ${total} articles` : "No articles yet."}
        </p>

        {entries.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No articles yet.</p>
        ) : (
          <>
            <PageNav page={clampedPage} totalPages={totalPages} />

            <ol className="space-y-6 mt-8">
              {entries.map((entry) => (
                <li key={entry.id} className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {entry.feed_name}
                    </span>
                    {entry.published_at && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(entry.published_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <a
                    href={entry.link ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline"
                  >
                    {entry.title}
                  </a>
                  {entry.author && (
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{entry.author}</p>
                  )}
                  {entry.summary && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{entry.summary}</p>
                  )}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <PageNav page={clampedPage} totalPages={totalPages} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
