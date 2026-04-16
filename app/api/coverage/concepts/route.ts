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

Your task: Identify terms or concepts from this brief that meet ALL of the following criteria:
1. Domain-specific — geopolitical, historical, legal, diplomatic, or doctrinal in nature
2. Not widely understood by a general educated audience
3. Context-dependent or easily misinterpreted without background knowledge

Use web search to retrieve accurate, current information for each qualifying concept.

DO NOT explain:
- Common military or security terms (e.g. "naval blockade", "airstrike", "sanctions")
- Well-known institutions or entities (e.g. "United Nations", "US Marines", "NATO", "Pentagon")
- Generic or self-explanatory phrases (e.g. "ceasefire talks", "diplomatic ties", "trade deficit")
- Concepts already described or implied by the topic title "${label}"
- Person names (those are covered separately)

Good examples of concepts worth explaining: "1992 Consensus", "Article 9 of the Japanese Constitution", "Five Eyes", "Monroe Doctrine", "AUKUS".

For each qualifying concept, write exactly 2 sentences: what it is, and why it matters in this specific context.

Format each entry as:
## [Concept or Term]
[2 sentences]

If no concepts meet the criteria, output nothing. Output concept entries only — no preamble, no conclusion, no bullet points.`;

  const stream = await openai.responses.create({
    model: "gpt-5.4-nano",
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
