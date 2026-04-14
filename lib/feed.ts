import { sql } from "./db";

export const PAGE_SIZE = 50;
export const MISC_TAG = "Misc";

export type FeedEntry = {
  id:               string;
  feed_name:        string;
  title:            string | null;   // always English (translated if necessary)
  original_title:   string | null;   // pre-translation; null for English-source entries
  link:             string | null;
  summary:          string | null;   // always English (translated if necessary)
  original_summary: string | null;   // pre-translation; null for English-source entries
  gist:             string | null;   // AI-generated summary of full article body (INTERLINK)
  author:           string | null;
  published_at:     string | null;
  geo_tags:         string[] | null;
  topic_tags:       string[] | null;
};

export async function getAllTags(): Promise<{ geoTags: string[]; topicTags: string[] }> {
  const [geoRows, topicRows] = await Promise.all([
    sql`SELECT DISTINCT unnest(geo_tags) AS tag FROM feed_entries ORDER BY tag`,
    sql`SELECT DISTINCT unnest(topic_tags) AS tag FROM feed_entries ORDER BY tag`,
  ]);
  return {
    geoTags: geoRows.map((r) => (r as { tag: string }).tag),
    topicTags: topicRows.map((r) => (r as { tag: string }).tag),
  };
}

export async function getFeedEntries(
  page: number,
  selectedGeoTags: string[],
  selectedTopicTags: string[],
  showMisc: boolean
): Promise<{ entries: FeedEntry[]; total: number }> {
  const offset = (page - 1) * PAGE_SIZE;

  // Boolean flags short-circuit the array conditions when no filter is active.
  // Placeholder arrays are never matched against because the flag is true.
  const skipGeo = selectedGeoTags.length === 0;
  const skipTopic = selectedTopicTags.length === 0;
  const geoParam = skipGeo ? [""] : selectedGeoTags;
  const topicParam = skipTopic ? [""] : selectedTopicTags;

  const [entries, countResult] = await Promise.all([
    sql`
      SELECT id, feed_name, title, link, summary, gist, author, published_at, geo_tags, topic_tags
      FROM feed_entries
      WHERE (${skipGeo} OR geo_tags && ${geoParam})
        AND (${skipTopic} OR topic_tags && ${topicParam})
        AND (${showMisc} OR topic_tags IS NULL OR topic_tags <> ARRAY[${MISC_TAG}]::text[])
      ORDER BY published_at DESC NULLS LAST
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*)
      FROM feed_entries
      WHERE (${skipGeo} OR geo_tags && ${geoParam})
        AND (${skipTopic} OR topic_tags && ${topicParam})
        AND (${showMisc} OR topic_tags IS NULL OR topic_tags <> ARRAY[${MISC_TAG}]::text[])
    `,
  ]);

  const deduped = (entries as FeedEntry[]).map((e) => ({
    ...e,
    geo_tags: e.geo_tags ? [...new Set(e.geo_tags)] : e.geo_tags,
    topic_tags: e.topic_tags ? [...new Set(e.topic_tags)] : e.topic_tags,
  }));

  return {
    entries: deduped,
    total: Number((countResult[0] as { count: string }).count),
  };
}
