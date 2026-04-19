import { openai } from "@/lib/openai";
import { ANALYTICAL_TAKE_MODEL, buildAnalyticalTakePrompt } from "@/lib/prompts";
import { streamingTextResponse, chatCompletionText } from "@/lib/streaming-response";

export async function POST(req: Request) {
  const { label, content, diff } = await req.json();

  const stream = await openai.chat.completions.create({
    model:    ANALYTICAL_TAKE_MODEL,
    messages: [{ role: "user", content: buildAnalyticalTakePrompt(label, content, diff ?? null) }],
    stream:   true,
  });

  return streamingTextResponse(stream, chatCompletionText);
}
