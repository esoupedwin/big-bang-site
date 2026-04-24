import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import {
  AUDIO_BRIEF_MODEL,
  AUDIO_BRIEF_SYSTEM_PROMPTS,
  AUDIO_BRIEF_TTS_MODEL,
  AUDIO_BRIEF_TTS_VOICES,
  buildAudioBriefUserMessage,
  sanitizeUserLabel,
} from "@/lib/prompts";

const SCRIPT_MAX_CHARS = 4096;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));

  const label    = sanitizeUserLabel((body.label    as string) ?? "");
  const headline = ((body.headline as string) ?? "").slice(0, 200);
  const content  = ((body.content  as string) ?? "").slice(0, 3000);
  const diff     = ((body.diff     as string) ?? "").slice(0, 1000);
  const tone     = (body.tone   as string) ?? "news_reporter";
  const gender   = (body.gender as string) === "female" ? "female" : "male";

  if (!label || !content) return new Response("Bad request", { status: 400 });

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

  const voice = AUDIO_BRIEF_TTS_VOICES[gender as keyof typeof AUDIO_BRIEF_TTS_VOICES];

  const tts = await openai.audio.speech.create({
    model:           AUDIO_BRIEF_TTS_MODEL,
    voice,
    input:           script,
    response_format: "mp3",
  });

  return new Response(tts.body, {
    headers: {
      "Content-Type":  "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
