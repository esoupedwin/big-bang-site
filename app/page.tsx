import Parser from "rss-parser";

type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
};

async function getNews(): Promise<FeedItem[]> {
  const parser = new Parser();
  const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
  return feed.items.sort(
    (a, b) => new Date(a.pubDate ?? 0).getTime() - new Date(b.pubDate ?? 0).getTime()
  );
}

export default async function Home() {
  const items = await getNews();

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">BBC News</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Latest headlines in chronological order</p>
        <ol className="space-y-6">
          {items.map((item, i) => (
            <li key={i} className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                {item.pubDate ? new Date(item.pubDate).toLocaleString() : ""}
              </p>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline"
              >
                {item.title}
              </a>
              {item.contentSnippet && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.contentSnippet}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
