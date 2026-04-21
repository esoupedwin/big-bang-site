import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { PERSONALITIES_MODEL, buildPersonalitiesPrompt, sanitizeUserLabel } from "@/lib/prompts";
import { streamingTextResponse, responsesApiText } from "@/lib/streaming-response";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = sanitizeUserLabel((body.label as string) ?? "");
  const content = (body.content as string) ?? "";

  if (!label || !content) return new Response("Bad request", { status: 400 });

  const stream = await openai.responses.create({
    model: PERSONALITIES_MODEL,
    tools: [{ type: "web_search_preview" }],
    input: buildPersonalitiesPrompt(label, content),
    stream: true,
  });

  return streamingTextResponse(stream, responsesApiText);
}
