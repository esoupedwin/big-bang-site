import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import {
  AUDIO_BRIEF_MODEL,
  AUDIO_BRIEF_SYSTEM_PROMPTS,
  buildAudioBriefUserMessage,
  sanitizeUserLabel,
} from "@/lib/prompts";
import { getLatestAudioScript, saveAudioScript } from "@/lib/brief";

export const maxDuration = 60;

const SCRIPT_MAX_CHARS = 4096;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));

  const topicKey = ((body.topicKey as string) ?? "").trim();
  const label    = sanitizeUserLabel((body.label    as string) ?? "");
  const headline = ((body.headline as string) ?? "").slice(0, 200);
  const content  = ((body.content  as string) ?? "").slice(0, 3000);
  const diff     = ((body.diff     as string) ?? "").slice(0, 1000);
  const tone     = (body.tone as string) ?? "news_reporter";

  if (!label || !content) return new Response("Bad request", { status: 400 });

  // Return cached script from DB if available (avoids regenerating for the same brief)
  if (topicKey) {
    const cached = await getLatestAudioScript(topicKey);
    if (cached) return Response.json({ script: cached });
  }

  const systemPrompt = AUDIO_BRIEF_SYSTEM_PROMPTS[tone] ?? AUDIO_BRIEF_SYSTEM_PROMPTS["news_reporter"];

  const scriptRes = await openai.chat.completions.create({
    model: AUDIO_BRIEF_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: buildAudioBriefUserMessage(label, headline, content, diff) },
    ],
  });

  const script = (scriptRes.choices[0]?.message?.content ?? "").slice(0, SCRIPT_MAX_CHARS);
  if (!script) return new Response("Script generation failed", { status: 500 });

  // Persist so the next play (same or different session) skips regeneration
  if (topicKey) {
    saveAudioScript(topicKey, script).catch(() => {}); // fire-and-forget
  }

  return Response.json({ script });
}
