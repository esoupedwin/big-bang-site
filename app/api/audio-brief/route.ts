import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import {
  AUDIO_BRIEF_MODEL,
  AUDIO_BRIEF_SYSTEM_PROMPT,
  AUDIO_BRIEF_TTS_MODEL,
  AUDIO_BRIEF_TTS_VOICE,
  buildAudioBriefUserMessage,
  sanitizeUserLabel,
} from "@/lib/prompts";

const SCRIPT_MAX_CHARS = 4096; // TTS hard limit is 4096 chars

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));

  const label    = sanitizeUserLabel((body.label    as string) ?? "");
  const headline = ((body.headline as string) ?? "").slice(0, 200);
  const content  = ((body.content  as string) ?? "").slice(0, 3000);
  const diff     = ((body.diff     as string) ?? "").slice(0, 1000);

  if (!label || !content) return new Response("Bad request", { status: 400 });

  // Step 1: Convert structured brief into a natural spoken script
  const scriptRes = await openai.chat.completions.create({
    model: AUDIO_BRIEF_MODEL,
    messages: [
      { role: "system", content: AUDIO_BRIEF_SYSTEM_PROMPT },
      { role: "user",   content: buildAudioBriefUserMessage(label, headline, content, diff) },
    ],
  });

  const script = (scriptRes.choices[0]?.message?.content ?? "").slice(0, SCRIPT_MAX_CHARS);
  if (!script) return new Response("Script generation failed", { status: 500 });

  // Step 2: Convert script to speech and stream audio back
  const tts = await openai.audio.speech.create({
    model:           AUDIO_BRIEF_TTS_MODEL,
    voice:           AUDIO_BRIEF_TTS_VOICE,
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
