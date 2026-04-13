import { sql } from "./db";
import { FeedEntry } from "./feed";

export const DAILY_BRIEF_GEO       = ["United States", "Iran", "Israel"];
export const DAILY_BRIEF_TOPIC     = ["Bilateral Relations", "Military"];
export const DAILY_BRIEF_TOPIC_KEY = "us-iran-israel";

export type DailyBriefCache = {
  topic_key:    string;
  content:      string;
  article_ids:  string[];
  generated_at: string;
  diff_summary: string | null;
};

export async function getDailyBriefEntries(): Promise<FeedEntry[]> {
  const rows = await sql`
    SELECT id, feed_name, title, link, summary, gist, author, published_at, geo_tags, topic_tags
    FROM feed_entries
    WHERE published_at >= NOW() - INTERVAL '24 hours'
      AND geo_tags   && ${DAILY_BRIEF_GEO}::text[]
      AND topic_tags && ${DAILY_BRIEF_TOPIC}::text[]
    ORDER BY published_at DESC
  `;
  return rows as FeedEntry[];
}

export async function getDailyBriefCache(topicKey: string): Promise<DailyBriefCache | null> {
  const rows = await sql`
    SELECT topic_key, content, article_ids, generated_at, diff_summary
    FROM daily_brief_cache
    WHERE topic_key = ${topicKey}
  `;
  return rows.length > 0 ? (rows[0] as DailyBriefCache) : null;
}

export async function saveDailyBriefCache(
  topicKey:    string,
  content:     string,
  articleIds:  string[],
  diffSummary: string | null
): Promise<void> {
  await sql`
    INSERT INTO daily_brief_cache (topic_key, content, article_ids, diff_summary)
    VALUES (${topicKey}, ${content}, ${articleIds}, ${diffSummary})
    ON CONFLICT (topic_key) DO UPDATE
      SET content      = ${content},
          article_ids  = ${articleIds},
          diff_summary = ${diffSummary},
          generated_at = NOW()
  `;
}

export function isCacheValid(cache: DailyBriefCache, currentIds: string[]): boolean {
  const a = [...cache.article_ids].sort();
  const b = [...currentIds].sort();
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}
