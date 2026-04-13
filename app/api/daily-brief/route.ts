import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import {
  getDailyBriefEntries,
  getDailyBriefCache,
  saveDailyBriefCache,
  appendDailyBriefHistory,
  DAILY_BRIEF_TOPIC_KEY,
} from "@/lib/brief";
import { SYNTHESIS_MODEL, DAILY_BRIEF_SYSTEM_PROMPT, buildDiffPrompt } from "@/lib/prompts";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [entries, previousCache] = await Promise.all([
    getDailyBriefEntries(),
    getDailyBriefCache(DAILY_BRIEF_TOPIC_KEY),
  ]);

  if (!entries.length) {
    return NextResponse.json(
      { error: "No articles found in the last 24 hours for this topic." },
      { status: 404 }
    );
  }

  const articleIds = entries.map((e) => String(e.id));

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
      let newContent = "";
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            newContent += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        // Assess diff against previous brief (if one exists)
        let diffSummary: string | null = null;
        if (previousCache?.content) {
          const diffResponse = await openai.chat.completions.create({
            model: SYNTHESIS_MODEL,
            messages: [
              {
                role: "user",
                content: buildDiffPrompt(previousCache.content, newContent, previousCache.generated_at),
              },
            ],
            stream: false,
          });
          diffSummary = diffResponse.choices[0]?.message?.content?.trim() ?? null;
        }

        await Promise.all([
          saveDailyBriefCache(DAILY_BRIEF_TOPIC_KEY, newContent, articleIds, diffSummary),
          appendDailyBriefHistory(DAILY_BRIEF_TOPIC_KEY, newContent, articleIds, diffSummary),
        ]);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
