import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { PRIORITIES_MODEL, buildPrioritiesPrompt, sanitizeUserLabel } from "@/lib/prompts";
import { streamingTextResponse, chatCompletionText } from "@/lib/streaming-response";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = sanitizeUserLabel((body.label as string) ?? "");
  if (!label) return new Response("Bad request", { status: 400 });

  const stream = await openai.chat.completions.create({
    model: PRIORITIES_MODEL,
    messages: [{ role: "user", content: buildPrioritiesPrompt(label) }],
    stream: true,
  });

  return streamingTextResponse(stream, chatCompletionText);
}
