import { sql } from "./db";
import { BRIEF_TOPICS } from "./brief";

/**
 * Idempotent schema migrations.
 * Safe to call on every request — each statement uses IF NOT EXISTS / DO NOTHING guards.
 */
export async function runMigrations(): Promise<void> {
  await sql`
    ALTER TABLE user_coverages
      ADD COLUMN IF NOT EXISTS priorities TEXT
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT        NOT NULL,
      achievement_key TEXT        NOT NULL,
      earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, achievement_key)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_stats (
      id       SERIAL PRIMARY KEY,
      user_id  TEXT    NOT NULL,
      stat_key TEXT    NOT NULL,
      value    INTEGER NOT NULL DEFAULT 0,
      UNIQUE (user_id, stat_key)
    )
  `;

  await sql`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
  `;

  await sql`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS coachmark_done BOOLEAN NOT NULL DEFAULT FALSE
  `;

  await sql`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS audio_brief_voice_gender TEXT NOT NULL DEFAULT 'male'
  `;

  await sql`
    ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS audio_brief_voice_tone TEXT NOT NULL DEFAULT 'news_reporter'
  `;

  await sql`
    ALTER TABLE daily_brief_history
      ADD COLUMN IF NOT EXISTS audio_script TEXT
  `;

  // Backfill priorities for rows seeded from defaults before this column existed.
  // Only touches rows where priorities IS NULL and the label matches a default topic.
  for (const t of BRIEF_TOPICS) {
    if (!t.priorities) continue;
    await sql`
      UPDATE user_coverages
      SET    priorities = ${t.priorities}
      WHERE  label      = ${t.label}
        AND  priorities IS NULL
    `;
  }
}
