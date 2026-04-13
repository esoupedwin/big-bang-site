import { sql } from "./db";
import { FeedEntry } from "./feed";

export type BriefTopic = {
  key:                  string;
  label:                string;
  geoTags:              string[];
  topicTags:            string[];
  systemPromptAddendum: string;
};

export const BRIEF_TOPICS: BriefTopic[] = [
  {
    key:       "us-iran-israel",
    label:     "US · Iran · Israel",
    geoTags:   ["United States", "Iran", "Israel"],
    topicTags: ["Bilateral Relations", "Military"],
    systemPromptAddendum: `
TOPIC-SPECIFIC FOCUS — US · Iran · Israel:
- Prioritise any developments in or around the Strait of Hormuz: shipping activity, Iranian naval posturing, seizures, or threats to freedom of navigation
- Track US carrier group and naval asset movements in the Persian Gulf and Red Sea
- Note Israeli airstrikes, drone operations, or cross-border fire involving Lebanon, Syria, Gaza, or Iran
- Monitor Iranian proxy activity: Hezbollah, Houthis, Iraqi militias — especially any coordinated escalation
- Flag any signals related to Iran's nuclear programme: enrichment milestones, IAEA access, or diplomatic back-channel activity
- Distinguish between direct state-to-state actions and proxy-mediated ones
`,
  },
  {
    key:       "china-taiwan",
    label:     "China · Taiwan",
    geoTags:   ["China", "Taiwan"],
    topicTags: ["Bilateral Relations", "Military"],
    systemPromptAddendum: `
TOPIC-SPECIFIC FOCUS — China · Taiwan:
- Prioritise PLA military activity: exercises, incursions into Taiwan's Air Defence Identification Zone (ADIZ), and naval movements in the Taiwan Strait and South China Sea
- Track US arms sales, military support, and naval transits through the Taiwan Strait
- Note any statements or actions from Beijing signalling shift in cross-strait posture — diplomatic, economic, or military
- Flag Taiwanese government responses and any changes in defence posture or mobilisation
- Monitor US–China diplomatic exchanges that touch on Taiwan's status
- Note involvement of third parties: Japan, Australia, Philippines — especially basing or overflight rights
`,
  },
  {
    key:       "ai-developments",
    label:     "AI Developments",
    geoTags:   ["United States", "China"],
    topicTags: ["Transnational", "AI"],
    systemPromptAddendum: `
TOPIC-SPECIFIC FOCUS — AI Developments:
- Prioritise major model releases, capability breakthroughs, and benchmark results from frontier labs (OpenAI, Google DeepMind, Anthropic, Meta, xAI, Mistral, DeepSeek, Baidu)
- Track regulatory and legislative developments: EU AI Act implementation, US executive orders, China's AI governance rules, UK policy positions
- Flag significant compute or infrastructure moves: chip export controls, data centre investments, energy agreements tied to AI
- Note corporate strategy shifts: mergers, acquisitions, partnerships, or lab spin-outs with strategic implications
- Monitor geopolitical dimensions of AI competition — particularly US–China technology rivalry and export restrictions
- Flag safety or alignment incidents, model misuse events, or significant public statements from governments or international bodies
- Distinguish between genuine capability advances and marketing announcements
`,
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
  // Valid as long as no new articles have appeared since the last generation.
  // Articles ageing out of the 24h rolling window do not require regeneration.
  const cachedSet = new Set(cache.article_ids);
  return currentIds.every((id) => cachedSet.has(id));
}
