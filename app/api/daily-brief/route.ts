import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { getDailyBriefEntries } from "@/lib/brief";
import { SYNTHESIS_MODEL, DAILY_BRIEF_SYSTEM_PROMPT } from "@/lib/prompts";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await getDailyBriefEntries();

  if (!entries.length) {
    return NextResponse.json({ error: "No articles found in the last 24 hours for this topic." }, { status: 404 });
  }

  const articleList = entries
    .map((e, i) => {
      const parts = [e.title, e.summary, e.gist].filter(Boolean).join("\n");
      return `[${i + 1}] ${parts}`;
    })
    .join("\n\n---\n\n");

  const stream = await openai.chat.completions.create({
    model: SYNTHESIS_MODEL,
    messages: [
      { role: "system", content: DAILY_BRIEF_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here are ${entries.length} articles from the past 24 hours covering the US-Iran-Israel conflict:\n\n${articleList}`,
      },
    ],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
