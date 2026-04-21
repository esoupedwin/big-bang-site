import { openai } from "@/lib/openai";
import { ANALYTICAL_TAKE_MODEL, buildAnalyticalTakePrompt, sanitizeUserLabel } from "@/lib/prompts";
import { streamingTextResponse, chatCompletionText } from "@/lib/streaming-response";
import { getDailyBriefHistory, sampleEvenly } from "@/lib/brief";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const topicKey = (body.topicKey as string) ?? "";
    const label    = sanitizeUserLabel((body.label as string) ?? "");
    const content  = (body.content as string) ?? "";

    if (!topicKey || !label || !content) return new Response("Bad request", { status: 400 });

    const allHistory = await getDailyBriefHistory(topicKey);
    const sampled    = sampleEvenly(allHistory, 5).filter((h) => h.diff_summary);
    const history    = sampled.map((h) => ({
      diff_summary: h.diff_summary!,
      generated_at: h.generated_at,
    }));

    const stream = await openai.chat.completions.create({
      model:    ANALYTICAL_TAKE_MODEL,
      messages: [{ role: "user", content: buildAnalyticalTakePrompt(label, content, history) }],
      stream:   true,
    });

    return streamingTextResponse(stream, chatCompletionText);
  } catch (err) {
    console.error("[analytical-take] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
