import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYNTHESIS_SYSTEM_PROMPT } from "@/lib/prompts";

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
  const {
    entries,
    selectedGeoTags = [],
    selectedTopicTags = [],
  }: { entries: EntryInput[]; selectedGeoTags: string[]; selectedTopicTags: string[] } =
    await req.json();

  if (!entries?.length) {
    return NextResponse.json({ error: "No entries provided" }, { status: 400 });
  }

  const focusParts = [
    selectedGeoTags.length > 0 ? `Geography: ${selectedGeoTags.join(", ")}` : null,
    selectedTopicTags.length > 0 ? `Topics: ${selectedTopicTags.join(", ")}` : null,
  ].filter(Boolean);

  const focusLine =
    focusParts.length > 0
      ? `Analytical focus: ${focusParts.join(" | ")}\n\n`
      : "";

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
        content: SYNTHESIS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `${focusLine}Based on the following ${entries.length} articles, provide a geopolitical synthesis:\n\n${articleList}`,
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
