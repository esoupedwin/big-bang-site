import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { CONCEPTS_MODEL, buildConceptsPrompt } from "@/lib/prompts";
import { streamingTextResponse, responsesApiText } from "@/lib/streaming-response";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { label, content } = body as { label?: string; content?: string };

  if (!label || !content) return new Response("Bad request", { status: 400 });

  const stream = await openai.responses.create({
    model: CONCEPTS_MODEL,
    tools: [{ type: "web_search_preview" }],
    input: buildConceptsPrompt(label, content),
    stream: true,
  });

  return streamingTextResponse(stream, responsesApiText);
}
