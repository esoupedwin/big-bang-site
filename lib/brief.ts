import { sql } from "./db";
import { FeedEntry } from "./feed";

export const DAILY_BRIEF_GEO   = ["United States", "Iran", "Israel"];
export const DAILY_BRIEF_TOPIC = ["Bilateral Relations", "Military"];

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
