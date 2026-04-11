import { sql } from "@/lib/db";

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

async function getFeedEntries(): Promise<FeedEntry[]> {
  const rows = await sql`
    SELECT id, feed_name, title, link, summary, author, published_at, tags
    FROM feed_entries
    ORDER BY published_at DESC NULLS LAST
  `;
  return rows as FeedEntry[];
}

export default async function Home() {
  const entries = await getFeedEntries();

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">News Feed</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          {entries.length} articles · newest first
        </p>

        {entries.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No articles yet.</p>
        ) : (
          <ol className="space-y-6">
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
        )}
      </div>
    </main>
  );
}
