import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!(await isAdmin(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [fetchStats, totalResult] = await Promise.all([
    sql`
      SELECT fetched_at, COUNT(*) AS entry_count
      FROM feed_entries
      WHERE fetched_at = (SELECT MAX(fetched_at) FROM feed_entries)
      GROUP BY fetched_at
    `,
    sql`SELECT COUNT(*) AS total FROM feed_entries`,
  ]);

  return NextResponse.json({
    latestFetch:      fetchStats[0]?.fetched_at  ?? null,
    latestFetchCount: Number(fetchStats[0]?.entry_count ?? 0),
    totalCount:       Number(totalResult[0]?.total ?? 0),
  });
}
