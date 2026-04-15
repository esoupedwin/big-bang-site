import { sql } from "./db";
import { BRIEF_TOPICS } from "./brief";

/**
 * Idempotent schema migrations.
 * Safe to call on every request — each statement uses IF NOT EXISTS / DO NOTHING guards.
 */
export async function runMigrations(): Promise<void> {
  // Ensure column exists
  await sql`
    ALTER TABLE user_coverages
      ADD COLUMN IF NOT EXISTS priorities TEXT
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
