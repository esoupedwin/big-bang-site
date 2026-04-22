import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import {
  AUDIO_BRIEF_MODEL,
  AUDIO_BRIEF_SYSTEM_PROMPT,
  buildAudioBriefUserMessage,
  sanitizeUserLabel,
} from "@/lib/prompts";

export const maxDuration = 60;

const SCRIPT_MAX_CHARS = 4096;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));

  const label    = sanitizeUserLabel((body.label    as string) ?? "");
  const headline = ((body.headline as string) ?? "").slice(0, 200);
  const content  = ((body.content  as string) ?? "").slice(0, 3000);
  const diff     = ((body.diff     as string) ?? "").slice(0, 1000);

  if (!label || !content) return new Response("Bad request", { status: 400 });

  const scriptRes = await openai.chat.completions.create({
    model: AUDIO_BRIEF_MODEL,
    messages: [
      { role: "system", content: AUDIO_BRIEF_SYSTEM_PROMPT },
      { role: "user",   content: buildAudioBriefUserMessage(label, headline, content, diff) },
    ],
  });

  const script = (scriptRes.choices[0]?.message?.content ?? "").slice(0, SCRIPT_MAX_CHARS);
  if (!script) return new Response("Script generation failed", { status: 500 });

  return Response.json({ script });
}
