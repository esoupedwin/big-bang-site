import { sql } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import { TagFilter } from "./components/TagFilter";

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

async function getAllTags(): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT unnest(tags) AS tag FROM feed_entries ORDER BY tag
  `;
  return rows.map((r) => (r as { tag: string }).tag);
}

async function getFeedEntries(
  page: number,
  selectedTags: string[]
): Promise<{ entries: FeedEntry[]; total: number }> {
  const offset = (page - 1) * PAGE_SIZE;
  const filtering = selectedTags.length > 0;

  const [entries, countResult] = await Promise.all([
    filtering
      ? sql`
          SELECT id, feed_name, title, link, summary, author, published_at, tags
          FROM feed_entries
          WHERE tags && ${selectedTags}
          ORDER BY published_at DESC NULLS LAST
          LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `
      : sql`
          SELECT id, feed_name, title, link, summary, author, published_at, tags
          FROM feed_entries
          ORDER BY published_at DESC NULLS LAST
          LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `,
    filtering
      ? sql`SELECT COUNT(*) FROM feed_entries WHERE tags && ${selectedTags}`
      : sql`SELECT COUNT(*) FROM feed_entries`,
  ]);

  return {
    entries: entries as FeedEntry[],
    total: Number((countResult[0] as { count: string }).count),
  };
}

function PageNav({ page, totalPages, selectedTags }: { page: number; totalPages: number; selectedTags: string[] }) {
  const tagParams = selectedTags.map((t) => `tags=${encodeURIComponent(t)}`).join("&");
  const base = tagParams ? `/?${tagParams}&` : "/?";

  return (
    <div className="flex items-center justify-between">
      {page > 1 ? (
        <Link
          href={`${base}page=${page - 1}`}
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
          href={`${base}page=${page + 1}`}
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tags?: string | string[] }>;
}) {
  const { page: pageParam, tags: tagsParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const selectedTags = tagsParam
    ? Array.isArray(tagsParam) ? tagsParam : [tagsParam]
    : [];

  const [allTags, { entries, total }] = await Promise.all([
    getAllTags(),
    getFeedEntries(page, selectedTags),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const clampedPage = Math.min(page, totalPages || 1);
  const start = (clampedPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(clampedPage * PAGE_SIZE, total);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">News Feed</h1>

        <Suspense>
          <TagFilter allTags={allTags} />
        </Suspense>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 mb-6">
          {total > 0 ? `${start}–${end} of ${total} articles` : "No articles found."}
        </p>

        {entries.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No articles found.</p>
        ) : (
          <>
            <PageNav page={clampedPage} totalPages={totalPages} selectedTags={selectedTags} />

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
              <PageNav page={clampedPage} totalPages={totalPages} selectedTags={selectedTags} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
