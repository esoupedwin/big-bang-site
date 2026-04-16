import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { label, content } = body as { label?: string; content?: string };

  if (!label || !content) return new Response("Bad request", { status: 400 });

  const prompt = `You are an intelligence analyst assistant. A user is reading a brief about: "${label}".

Brief content:
${content}

Your task: Identify all significant personalities mentioned (or strongly implied) in this brief. For each one, use web search to retrieve the most current factual information, then write a structured profile.

Format rules — for each personality, use exactly this structure:

## [Full Name]

**Background:** [Exactly 2 sentences of factual background — their role, position, and relevant history.]

**Significance:** [Exactly 2 sentences explaining why this person matters specifically to this coverage topic and what their current involvement or stance is.]

Output personality profiles only — no preamble, no conclusion, no extra commentary.`;

  const stream = await openai.responses.create({
    model: "gpt-5.4-mini",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          const text = (event as { type: string; delta: string }).delta;
          if (text) controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
