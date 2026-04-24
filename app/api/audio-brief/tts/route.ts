import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { AUDIO_BRIEF_TTS_MODEL, AUDIO_BRIEF_TTS_VOICES } from "@/lib/prompts";

export const maxDuration = 60;

const SCRIPT_MAX_CHARS = 4096;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const script = ((body.script as string) ?? "").slice(0, SCRIPT_MAX_CHARS);
  const gender = (body.gender as string) === "female" ? "female" : "male";

  if (!script) return new Response("Bad request", { status: 400 });

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
