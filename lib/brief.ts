import { sql } from "./db";
import { FeedEntry } from "./feed";

export type BriefTopic = {
  key:                  string;
  label:                string;
  geoTags:              string[];
  topicTags:            string[];
  priorities:           string | null;
  systemPromptAddendum: string;
};

/**
 * Default coverage topics seeded into every new user's `user_coverages` table on first sign-in.
 * At runtime the Daily Brief reads coverages from the DB (not this array directly) so that
 * users can add, remove, and customise their own coverages.
 *
 * This array is still referenced in two places:
 *  - `lib/coverages.ts` → `initializeUserCoverages`: inserts these as the starting set for new users
 *  - `lib/migrate.ts`   → `runMigrations`: backfills the `priorities` column on rows that were
 *    seeded before that column existed, matching by label
 */
export const BRIEF_TOPICS: BriefTopic[] = [
  {
    key:       "us-iran-israel",
    label:     "Latest Developments in the US–Iran–Israel Conflict in the Middle East",
    geoTags:   ["United States", "Iran", "Israel"],
    topicTags: ["Bilateral Relations", "Military"],
    priorities: `- Prioritise any developments in or around the Strait of Hormuz: shipping activity, Iranian naval posturing, seizures, or threats to freedom of navigation
- Track US carrier group and naval asset movements in the Persian Gulf and Red Sea
- Note Israeli airstrikes, drone operations, or cross-border fire involving Lebanon, Syria, Gaza, or Iran
- Monitor Iranian proxy activity: Hezbollah, Houthis, Iraqi militias — especially any coordinated escalation
- Flag any signals related to Iran's nuclear programme: enrichment milestones, IAEA access, or diplomatic back-channel activity
- Distinguish between direct state-to-state actions and proxy-mediated ones`,
    systemPromptAddendum: `
COVERAGE FOCUS: Latest Developments in the US–Iran–Israel Conflict in the Middle East
Every bullet must be directly relevant to this coverage. Prioritise events that advance, escalate, de-escalate, or reframe the US–Iran–Israel conflict dynamic. Discard articles that do not materially relate to this triangular relationship or its immediate theatre.
`,
  },
  {
    key:       "china-taiwan",
    label:     "Latest Developments in China–Taiwan Cross-Strait Relations",
    geoTags:   ["China", "Taiwan"],
    topicTags: ["Bilateral Relations", "Military"],
    priorities: `- Prioritise PLA military activity: exercises, incursions into Taiwan's Air Defence Identification Zone (ADIZ), and naval movements in the Taiwan Strait and South China Sea
- Track US arms sales, military support, and naval transits through the Taiwan Strait
- Note any statements or actions from Beijing signalling shift in cross-strait posture — diplomatic, economic, or military
- Flag Taiwanese government responses and any changes in defence posture or mobilisation
- Monitor US–China diplomatic exchanges that touch on Taiwan's status
- Note involvement of third parties: Japan, Australia, Philippines — especially basing or overflight rights`,
    systemPromptAddendum: `
COVERAGE FOCUS: Latest Developments in China–Taiwan Cross-Strait Relations
Every bullet must be directly relevant to this coverage. Prioritise events that shift the military balance, diplomatic posture, or political status across the Taiwan Strait. Discard articles that do not materially affect cross-strait dynamics.
`,
  },
  {
    key:       "ai-developments",
    label:     "AI Landscape Update: Capabilities, Initiatives, and Emerging Trends",
    geoTags:   [], // empty = no geo filter (all countries)
    topicTags: ["AI"],
    priorities: `- Prioritise major model releases, capability breakthroughs, and benchmark results from frontier labs (OpenAI, Google DeepMind, Anthropic, Meta, xAI, Mistral, DeepSeek, Baidu)
- Track regulatory and legislative developments: EU AI Act implementation, US executive orders, China's AI governance rules, UK policy positions
- Flag significant compute or infrastructure moves: chip export controls, data centre investments, energy agreements tied to AI
- Note corporate strategy shifts: mergers, acquisitions, partnerships, or lab spin-outs with strategic implications
- Monitor geopolitical dimensions of AI competition — particularly US–China technology rivalry and export restrictions
- Flag safety or alignment incidents, model misuse events, or significant public statements from governments or international bodies
- Distinguish between genuine capability advances and marketing announcements`,
    systemPromptAddendum: `
COVERAGE FOCUS: AI Landscape Update: Capabilities, Initiatives, and Emerging Trends
Every bullet must be directly relevant to this coverage. Prioritise developments that meaningfully shift the AI capability frontier, the competitive landscape, or the policy and governance environment. Discard articles that are tangential to AI or lack material significance.
`,
  },
];

export type DailyBriefCache = {
  topic_key:        string;
  content:          string;
  article_ids:      string[];
  generated_at:     string;
  diff_summary:     string | null;
  headline:         string | null;
  status:           string;        // 'idle' | 'generating'
  generating_since: string | null;
};

export async function getDailyBriefEntries(topic: BriefTopic): Promise<FeedEntry[]> {
  // Tag matching uses PostgreSQL's && (array overlap) operator:
  //   - Within geo_tags:   OR  — article matches if it has ANY of the coverage's geo tags
  //   - Within topic_tags: OR  — article matches if it has ANY of the coverage's topic tags
  //   - Between the two:   AND — article must satisfy BOTH the geo and topic conditions
  // An empty geoTags array means "all countries" — the geo filter is skipped entirely.
  const skipGeo = topic.geoTags.length === 0;
  const rows = await sql`
    SELECT id, feed_name, title, link, summary, gist, author, published_at, fetched_at, geo_tags, topic_tags
    FROM feed_entries
    WHERE published_at >= NOW() - INTERVAL '24 hours'
      AND (${skipGeo} OR geo_tags && ${topic.geoTags}::text[])
      AND topic_tags && ${topic.topicTags}::text[]
    ORDER BY
      -- Primary: articles whose geo_tags overlap the coverage's tags more closely rank first.
      -- Counts how many of the article's geo tags appear in the coverage's geo tag list.
      -- When geoTags is empty (all-countries coverage), this is always 0 → pure chronological order.
      (SELECT COUNT(*) FROM unnest(geo_tags) g WHERE g = ANY(${topic.geoTags}::text[])) DESC,
      published_at DESC
  `;
  return rows as FeedEntry[];
}

export async function getDailyBriefCache(topicKey: string): Promise<DailyBriefCache | null> {
  const rows = await sql`
    SELECT topic_key, content, article_ids, generated_at, diff_summary, headline, status, generating_since
    FROM daily_brief_cache
    WHERE topic_key = ${topicKey}
  `;
  return rows.length > 0 ? (rows[0] as DailyBriefCache) : null;
}

export async function saveDailyBriefCache(
  topicKey:    string,
  content:     string,
  articleIds:  string[],
  diffSummary: string | null,
  headline:    string | null
): Promise<void> {
  await sql`
    INSERT INTO daily_brief_cache (topic_key, content, article_ids, diff_summary, headline, status, generating_since)
    VALUES (${topicKey}, ${content}, ${articleIds}, ${diffSummary}, ${headline}, 'idle', NULL)
    ON CONFLICT (topic_key) DO UPDATE
      SET content           = ${content},
          article_ids       = ${articleIds},
          diff_summary      = ${diffSummary},
          headline          = ${headline},
          generated_at      = NOW(),
          status            = 'idle',
          generating_since  = NULL
  `;
}

export async function setGeneratingStatus(topicKey: string, generating: boolean): Promise<void> {
  if (generating) {
    await sql`
      INSERT INTO daily_brief_cache (topic_key, status, generating_since, content, article_ids)
      VALUES (${topicKey}, 'generating', NOW(), '', '{}')
      ON CONFLICT (topic_key) DO UPDATE
        SET status           = 'generating',
            generating_since = NOW()
    `;
  } else {
    await sql`
      UPDATE daily_brief_cache
      SET status = 'idle', generating_since = NULL
      WHERE topic_key = ${topicKey}
    `;
  }
}

export type BriefHistoryEntry = {
  diff_summary: string | null;
  generated_at: string;
};

export async function getHistoryCount(topicKey: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS count
    FROM   daily_brief_history
    WHERE  topic_key    = ${topicKey}
      AND  diff_summary IS NOT NULL
  `;
  return parseInt(rows[0].count as string, 10);
}

export async function getDailyBriefHistory(topicKey: string): Promise<BriefHistoryEntry[]> {
  const rows = await sql`
    SELECT diff_summary, generated_at
    FROM   daily_brief_history
    WHERE  topic_key    = ${topicKey}
      AND  diff_summary IS NOT NULL
    ORDER BY generated_at ASC
  `;
  return rows as BriefHistoryEntry[];
}

export function sampleEvenly<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, i) =>
    items[Math.round(i * (items.length - 1) / (n - 1))]
  );
}

export async function appendDailyBriefHistory(
  topicKey:    string,
  content:     string,
  articleIds:  string[],
  diffSummary: string | null,
  headline:    string | null
): Promise<void> {
  await sql`
    INSERT INTO daily_brief_history (topic_key, content, article_ids, article_count, diff_summary, headline)
    VALUES (${topicKey}, ${content}, ${articleIds}, ${articleIds.length}, ${diffSummary}, ${headline})
  `;
}

export function isCacheValid(cache: DailyBriefCache, currentIds: string[]): boolean {
  // Valid as long as no new articles have appeared since the last generation.
  // Articles ageing out of the 24h rolling window do not require regeneration.
  const cachedSet = new Set(cache.article_ids);
  return currentIds.every((id) => cachedSet.has(id));
}
