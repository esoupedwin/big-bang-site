import { sql } from "./db";
import { BriefTopic, BRIEF_TOPICS } from "./brief";

export type UserCoverage = {
  id:         string;
  user_id:    string;
  label:      string;
  geo_tags:   string[];
  topic_tags: string[];
  priorities: string | null;
  sort_order: number;
  created_at: string;
};

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
  return rows[0]?.id ?? null;
}

export async function getUserCoverages(userId: string): Promise<UserCoverage[]> {
  const rows = await sql`
    SELECT id, user_id, label, geo_tags, topic_tags, priorities, sort_order, created_at
    FROM user_coverages
    WHERE user_id = ${userId}
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows as UserCoverage[];
}

// Seeds the user's coverage list from the defaults on first use.
export async function initializeUserCoverages(userId: string): Promise<void> {
  const existing = await sql`SELECT 1 FROM user_coverages WHERE user_id = ${userId} LIMIT 1`;
  if (existing.length > 0) return;

  for (let i = 0; i < BRIEF_TOPICS.length; i++) {
    const t = BRIEF_TOPICS[i];
    await sql`
      INSERT INTO user_coverages (user_id, label, geo_tags, topic_tags, priorities, sort_order)
      VALUES (${userId}, ${t.label}, ${t.geoTags}, ${t.topicTags}, ${t.priorities ?? null}, ${i})
    `;
  }
}

export async function addUserCoverage(
  userId:     string,
  label:      string,
  geoTags:    string[],
  topicTags:  string[],
  priorities: string | null,
): Promise<void> {
  const rows = await sql`
    SELECT COALESCE(MAX(sort_order), -1) AS max FROM user_coverages WHERE user_id = ${userId}
  `;
  const nextOrder = Number(rows[0].max) + 1;
  await sql`
    INSERT INTO user_coverages (user_id, label, geo_tags, topic_tags, priorities, sort_order)
    VALUES (${userId}, ${label}, ${geoTags}, ${topicTags}, ${priorities}, ${nextOrder})
  `;
}

export async function updateUserCoverage(
  userId:     string,
  coverageId: string,
  label:      string,
  geoTags:    string[],
  topicTags:  string[],
  priorities: string | null,
): Promise<void> {
  await sql`
    UPDATE user_coverages
    SET label      = ${label},
        geo_tags   = ${geoTags},
        topic_tags = ${topicTags},
        priorities = ${priorities}
    WHERE id      = ${coverageId}
      AND user_id = ${userId}
  `;
}

export async function removeUserCoverage(userId: string, coverageId: string): Promise<void> {
  await sql`DELETE FROM user_coverages WHERE id = ${coverageId} AND user_id = ${userId}`;
}

export function userCoverageToBriefTopic(c: UserCoverage): BriefTopic {
  const prioritiesBlock = c.priorities?.trim()
    ? `\nTOPIC-SPECIFIC PRIORITIES:\n${c.priorities.trim()}\n`
    : "";

  return {
    key:        c.id,
    label:      c.label,
    geoTags:    c.geo_tags,
    topicTags:  c.topic_tags,
    priorities: c.priorities,
    systemPromptAddendum: `
COVERAGE FOCUS: ${c.label}
Every bullet must be directly relevant to this coverage. Prioritise events that directly advance, escalate, de-escalate, or reframe this coverage area. Discard articles that do not materially relate to this coverage focus.
${prioritiesBlock}`,
  };
}
