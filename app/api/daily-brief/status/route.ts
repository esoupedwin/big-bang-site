import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDailyBriefCache } from "@/lib/brief";
import { getUserIdByEmail, getUserCoverages } from "@/lib/coverages";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topicKey = req.nextUrl.searchParams.get("topic") ?? "";

  const userId   = await getUserIdByEmail(session.user.email);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coverages = await getUserCoverages(userId);
  const coverage  = coverages.find((c) => c.id === topicKey);
  if (!coverage) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });

  const cache = await getDailyBriefCache(topicKey);

  return NextResponse.json({
    status:      cache?.status ?? "generating",
    content:     cache?.content     ?? null,
    headline:    cache?.headline    ?? null,
    diffSummary: cache?.diff_summary ?? null,
    generatedAt: cache?.generated_at ?? null,
  });
}
