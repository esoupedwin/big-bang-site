import { sql } from "@/lib/db";

type FeedItem = {
  id: number;
  title: string | null;
  link: string | null;
  pub_date: string | null;
  snippet: string | null;
  synced_at: string | null;
};

async function getFeedItems(): Promise<FeedItem[]> {
  const rows = await sql<FeedItem[]>`
    SELECT id, title, link, pub_date, snippet, synced_at
    FROM feed_items
    ORDER BY pub_date ASC
  `;
  return rows;
}

export default async function Home() {
  const items = await getFeedItems();

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">BBC News</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          {items.length} articles stored · oldest first
        </p>

        {items.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No articles yet. The sync runs every hour, or trigger it manually at{" "}
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
              /api/sync-feed
            </code>
            .
          </p>
        ) : (
          <ol className="space-y-6">
            {items.map((item) => (
              <li key={item.id} className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                  {item.pub_date ? new Date(item.pub_date).toLocaleString() : ""}
                </p>
                <a
                  href={item.link ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline"
                >
                  {item.title}
                </a>
                {item.snippet && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.snippet}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
