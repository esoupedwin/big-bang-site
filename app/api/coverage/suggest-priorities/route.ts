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
  const label = (body.label as string)?.trim();
  if (!label) return new Response("Bad request", { status: 400 });

  const stream = await openai.chat.completions.create({
    model: "gpt-5.4-nano",
    messages: [
      {
        role: "user",
        content: `Generate topic-specific priorities for a geopolitical intelligence brief covering: "${label}".

Output rules:
- Output ONLY bullet points (use - prefix)
- 5–7 specific, actionable priorities
- Each priority should guide what to focus on: key actors, locations, events, and indicators to track
- Be concrete — name relevant actors, flashpoints, metrics, or thresholds worth watching
- No preamble, no headers, no closing remarks — bullets only`,
      },
    ],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
