import { openai } from "@/lib/openai";
import { ANALYTICAL_TAKE_MODEL, buildAnalyticalTakePrompt } from "@/lib/prompts";
import { streamingTextResponse, chatCompletionText } from "@/lib/streaming-response";
import { getDailyBriefHistory, sampleEvenly } from "@/lib/brief";

export async function POST(req: Request) {
  const { topicKey, label, content } = await req.json();

  const allHistory = await getDailyBriefHistory(topicKey);
  const sampled    = sampleEvenly(allHistory, 5).filter((h) => h.diff_summary);
  const history    = sampled.map((h) => ({
    diff_summary: h.diff_summary!,
    created_at:   h.created_at,
  }));

  const stream = await openai.chat.completions.create({
    model:    ANALYTICAL_TAKE_MODEL,
    messages: [{ role: "user", content: buildAnalyticalTakePrompt(label, content, history) }],
    stream:   true,
  });

  return streamingTextResponse(stream, chatCompletionText);
}
