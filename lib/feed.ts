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
  fetched_at:       string | null;
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

const SEARCH_MAX_LEN   = 200; // chars — reject anything longer
const SEARCH_MAX_GROUPS = 5;  // max OR groups
const SEARCH_MAX_TERMS  = 8;  // max AND terms per group

// Escape PostgreSQL LIKE/ILIKE special characters so user input is always
// treated as a literal substring, never as a pattern wildcard.
function escapeLike(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// Parse search query into OR groups of AND terms.
// " OR " (caps, space-padded) is the OR operator; spaces within a group are AND.
// e.g. "Iran Conflict OR Trump" → [["Iran","Conflict"], ["Trump"]]
export function parseSearch(query: string): string[][] {
  return query
    .trim()
    .slice(0, SEARCH_MAX_LEN)
    .split(" OR ")
    .slice(0, SEARCH_MAX_GROUPS)
    .map((g) => g.trim().split(/\s+/).filter(Boolean).slice(0, SEARCH_MAX_TERMS))
    .filter((g) => g.length > 0);
}

export async function getFeedEntries(
  page: number,
  selectedGeoTags: string[],
  selectedTopicTags: string[],
  showMisc: boolean,
  search: string = ""
): Promise<{ entries: FeedEntry[]; total: number }> {
  const offset = (page - 1) * PAGE_SIZE;
  const searchGroups = search.trim() === "" ? [] : parseSearch(search);

  // Build a dynamic parameterised query so that the search clause can express
  // arbitrary AND/OR term combinations without SQL injection risk.
  const params: unknown[] = [];
  const p = (val: unknown) => { params.push(val); return `$${params.length}`; };

  const conditions: string[] = [];

  if (selectedGeoTags.length > 0) {
    conditions.push(`geo_tags && ${p(selectedGeoTags)}::text[]`);
  }
  if (selectedTopicTags.length > 0) {
    conditions.push(`topic_tags && ${p(selectedTopicTags)}::text[]`);
  }
  if (!showMisc) {
    conditions.push(`(topic_tags IS NULL OR topic_tags <> ARRAY[${p(MISC_TAG)}]::text[])`);
  }
  if (searchGroups.length > 0) {
    const orClauses = searchGroups.map((terms) => {
      const andClauses = terms.map((term) => {
        const pat = p(`%${escapeLike(term)}%`);
        return `(title ILIKE ${pat} ESCAPE '\\' OR summary ILIKE ${pat} ESCAPE '\\' OR gist ILIKE ${pat} ESCAPE '\\')`;
      });
      return `(${andClauses.join(" AND ")})`;
    });
    conditions.push(`(${orClauses.join(" OR ")})`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Use COUNT(*) OVER() to get the total in a single round-trip.
  const limitP = p(PAGE_SIZE);
  const offsetP = p(offset);

  const rows = await sql.query(
    `SELECT id, feed_name, title, link, summary, gist, author, published_at, fetched_at,
            geo_tags, topic_tags, COUNT(*) OVER() AS total_count
     FROM feed_entries
     ${where}
     ORDER BY published_at DESC NULLS LAST
     LIMIT ${limitP} OFFSET ${offsetP}`,
    params
  ) as (FeedEntry & { total_count: string })[];

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  const deduped = rows.map((e) => ({
    ...e,
    geo_tags: e.geo_tags ? [...new Set(e.geo_tags)] : e.geo_tags,
    topic_tags: e.topic_tags ? [...new Set(e.topic_tags)] : e.topic_tags,
  }));

  return { entries: deduped, total };
}
