import OpenAI from "openai";
import {
  BriefTopic,
  DailyBriefCache,
  saveDailyBriefCache,
  appendDailyBriefHistory,
  setGeneratingStatus,
} from "./brief";
import { FeedEntry } from "./feed";
import {
  SYNTHESIS_MODEL,
  HEADLINE_MODEL,
  buildBriefSystemPrompt,
  buildDiffPrompt,
  buildHeadlinePrompt,
} from "./prompts";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateBriefForTopic(
  topic:         BriefTopic,
  entries:       FeedEntry[],
  previousCache: DailyBriefCache | null
): Promise<void> {
  try {
    const articleIds = entries.map((e) => String(e.id));
    const articleList = entries
      .map((e, i) => {
        const parts = [e.title, e.summary, e.gist].filter(Boolean).join("\n");
        return `[${i + 1}] ${parts}`;
      })
      .join("\n\n---\n\n");

    // Generate bullets (non-streaming — no client watching)
    const bulletsResponse = await openai.chat.completions.create({
      model: SYNTHESIS_MODEL,
      messages: [
        { role: "system", content: buildBriefSystemPrompt(topic.systemPromptAddendum) },
        {
          role: "user",
          content: `Context: ${topic.label}\n\nHere are ${entries.length} articles from the past 24 hours:\n\n${articleList}`,
        },
      ],
      stream: false,
    });

    const newContent = bulletsResponse.choices[0]?.message?.content?.trim() ?? "";

    // Generate diff + headline in parallel
    const [diffSummary, headline] = await Promise.all([
      previousCache?.content
        ? openai.chat.completions.create({
            model: SYNTHESIS_MODEL,
            messages: [
              {
                role: "user",
                content: buildDiffPrompt(
                  previousCache.content,
                  newContent,
                  previousCache.generated_at,
                  topic.label
                ),
              },
            ],
            stream: false,
          }).then((r) => r.choices[0]?.message?.content?.trim() ?? null)
        : Promise.resolve(null),
      openai.chat.completions.create({
        model: HEADLINE_MODEL,
        messages: [{ role: "user", content: buildHeadlinePrompt(newContent, topic.label) }],
        stream: false,
      }).then((r) => r.choices[0]?.message?.content?.trim() ?? null),
    ]);

    await Promise.all([
      saveDailyBriefCache(topic.key, newContent, articleIds, diffSummary, headline),
      appendDailyBriefHistory(topic.key, newContent, articleIds, diffSummary, headline),
    ]);
  } catch (err) {
    console.error(`[generate-brief] Error generating brief for ${topic.key}:`, err);
    // Reset status so the next page load can retry
    await setGeneratingStatus(topic.key, false);
  }
}
