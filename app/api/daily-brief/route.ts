import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import {
  BRIEF_TOPICS,
  getDailyBriefEntries,
  getDailyBriefCache,
  saveDailyBriefCache,
  appendDailyBriefHistory,
} from "@/lib/brief";
import { SYNTHESIS_MODEL, HEADLINE_MODEL, HEADLINE_MARKER, buildBriefSystemPrompt, buildDiffPrompt, buildHeadlinePrompt } from "@/lib/prompts";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topicKey = req.nextUrl.searchParams.get("topic") ?? "";
  const topic = BRIEF_TOPICS.find((t) => t.key === topicKey);
  if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });

  const [entries, previousCache] = await Promise.all([
    getDailyBriefEntries(topic),
    getDailyBriefCache(topic.key),
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
      { role: "system", content: buildBriefSystemPrompt(topic.systemPromptAddendum) },
      {
        role: "user",
        content: `Context: ${topic.label}\n\nHere are ${entries.length} articles from the past 24 hours:\n\n${articleList}`,
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

        const [diffSummary, headline] = await Promise.all([
          previousCache?.content
            ? openai.chat.completions.create({
                model: SYNTHESIS_MODEL,
                messages: [{ role: "user", content: buildDiffPrompt(previousCache.content, newContent, previousCache.generated_at, topic.label) }],
                stream: false,
              }).then((r) => r.choices[0]?.message?.content?.trim() ?? null)
            : Promise.resolve(null),
          openai.chat.completions.create({
            model: HEADLINE_MODEL,
            messages: [{ role: "user", content: buildHeadlinePrompt(newContent, topic.label) }],
            stream: false,
          }).then((r) => r.choices[0]?.message?.content?.trim() ?? null),
        ]);

        if (headline) {
          controller.enqueue(encoder.encode(`\n\n${HEADLINE_MARKER}${headline}`));
        }

        await Promise.all([
          saveDailyBriefCache(topic.key, newContent, articleIds, diffSummary, headline),
          appendDailyBriefHistory(topic.key, newContent, articleIds, diffSummary, headline),
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
