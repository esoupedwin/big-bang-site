import { sql } from "./db";
import { FeedEntry } from "./feed";

export type BriefTopic = {
  key:       string;
  label:     string;
  geoTags:   string[];
  topicTags: string[];
};

export const BRIEF_TOPICS: BriefTopic[] = [
  {
    key:       "us-iran-israel",
    label:     "US · Iran · Israel",
    geoTags:   ["United States", "Iran", "Israel"],
    topicTags: ["Bilateral Relations", "Military"],
  },
  {
    key:       "china-taiwan",
    label:     "China · Taiwan",
    geoTags:   ["China", "Taiwan"],
    topicTags: ["Bilateral Relations", "Military"],
  },
];

export type DailyBriefCache = {
  topic_key:    string;
  content:      string;
  article_ids:  string[];
  generated_at: string;
  diff_summary: string | null;
};

export async function getDailyBriefEntries(topic: BriefTopic): Promise<FeedEntry[]> {
  const rows = await sql`
    SELECT id, feed_name, title, link, summary, gist, author, published_at, geo_tags, topic_tags
    FROM feed_entries
    WHERE published_at >= NOW() - INTERVAL '24 hours'
      AND geo_tags   && ${topic.geoTags}::text[]
      AND topic_tags && ${topic.topicTags}::text[]
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

export async function appendDailyBriefHistory(
  topicKey:    string,
  content:     string,
  articleIds:  string[],
  diffSummary: string | null
): Promise<void> {
  await sql`
    INSERT INTO daily_brief_history (topic_key, content, article_ids, article_count, diff_summary)
    VALUES (${topicKey}, ${content}, ${articleIds}, ${articleIds.length}, ${diffSummary})
  `;
}

export function isCacheValid(cache: DailyBriefCache, currentIds: string[]): boolean {
  const a = [...cache.article_ids].sort();
  const b = [...currentIds].sort();
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}
