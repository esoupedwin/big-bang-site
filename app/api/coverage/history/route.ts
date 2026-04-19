import { sql } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topicKey = searchParams.get("topic");
  if (!topicKey) return new Response("Missing topic", { status: 400 });

  const rows = await sql`
    SELECT generated_at, headline, content, diff_summary
    FROM   daily_brief_history
    WHERE  topic_key = ${topicKey}
    ORDER BY generated_at DESC
  `;

  return Response.json(rows);
}
