import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type EntryInput = {
  title: string | null;
  summary: string | null;
  gist: string | null;
};

export async function POST(req: NextRequest) {
  const { entries }: { entries: EntryInput[] } = await req.json();

  if (!entries?.length) {
    return NextResponse.json({ error: "No entries provided" }, { status: 400 });
  }

  const articleList = entries
    .map((e, i) => {
      const parts = [e.title, e.summary, e.gist].filter(Boolean).join("\n");
      return `[${i + 1}] ${parts}`;
    })
    .join("\n\n---\n\n");

  const stream = await openai.chat.completions.create({
    model: "gpt-5.4",
    messages: [
      {
        role: "system",
        content:
          "You are an expert geopolitical analyst. Given a set of news articles, produce a concise, insightful synthesis of the key developments, patterns, and implications. Write in clear prose — no bullet points. Focus on what the articles collectively reveal rather than summarising each one individually.",
      },
      {
        role: "user",
        content: `Based on the following ${entries.length} articles, provide a geopolitical synthesis:\n\n${articleList}`,
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
