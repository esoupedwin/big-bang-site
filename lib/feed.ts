import { sql } from "./db";

export const PAGE_SIZE = 50;

export type FeedEntry = {
  id: string;
  feed_name: string;
  title: string | null;
  link: string | null;
  summary: string | null;
  author: string | null;
  published_at: string | null;
  tags: string[] | null;
};

export async function getAllTags(): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT unnest(tags) AS tag FROM feed_entries ORDER BY tag
  `;
  return rows.map((r) => (r as { tag: string }).tag);
}

export async function getFeedEntries(
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
