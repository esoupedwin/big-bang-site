import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BRIEF_TOPICS, getDailyBriefCache } from "@/lib/brief";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topicKey = req.nextUrl.searchParams.get("topic") ?? "";
  const topic = BRIEF_TOPICS.find((t) => t.key === topicKey);
  if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });

  const cache = await getDailyBriefCache(topicKey);

  return NextResponse.json({
    status:      cache?.status ?? "generating",
    content:     cache?.content     ?? null,
    headline:    cache?.headline    ?? null,
    diffSummary: cache?.diff_summary ?? null,
    generatedAt: cache?.generated_at ?? null,
  });
}
