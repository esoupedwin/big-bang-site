import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import {
  BRIEF_TOPICS,
  getDailyBriefEntries,
  getDailyBriefCache,
  isCacheValid,
  setGeneratingStatus,
} from "@/lib/brief";
import { generateBriefForTopic } from "@/lib/generate-brief";

// Allow the after() callback enough time to complete LLM generation.
// Requires Vercel Pro or higher.
export const maxDuration = 300;

// Treat a lock older than this as stale (crashed job) and allow retriggering.
const STALE_LOCK_MS = 3 * 60 * 1000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { topicKey, force = false } = body as { topicKey?: string; force?: boolean };

  const topic = BRIEF_TOPICS.find((t) => t.key === topicKey);
  if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });

  const [entries, cache] = await Promise.all([
    getDailyBriefEntries(topic),
    getDailyBriefCache(topic.key),
  ]);

  const articleCount = entries.length;

  if (articleCount === 0) {
    return NextResponse.json({ status: "empty" });
  }

  const articleIds = entries.map((e) => String(e.id));

  // Cache is still valid — no new articles since last generation (skip if forced)
  if (!force && cache && isCacheValid(cache, articleIds)) {
    return NextResponse.json({
      status:      "ready",
      content:     cache.content,
      headline:    cache.headline,
      diffSummary: cache.diff_summary,
      generatedAt: cache.generated_at,
      articleCount,
    });
  }

  // A job is already running and the lock is fresh — piggyback on it
  if (cache?.status === "generating" && cache.generating_since) {
    const lockAgeMs = Date.now() - new Date(cache.generating_since).getTime();
    if (lockAgeMs < STALE_LOCK_MS) {
      return NextResponse.json({ status: "generating", articleCount });
    }
  }

  // Start background generation; respond to the client immediately
  await setGeneratingStatus(topic.key, true);
  after(() => generateBriefForTopic(topic, entries, cache));

  return NextResponse.json({ status: "generating", articleCount });
}
