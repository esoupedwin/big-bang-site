import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { EXPLAIN_MODEL } from "@/lib/prompts";

export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are a concise intelligence analyst. The user has highlighted a term or phrase from a geopolitical brief and wants a quick explanation. " +
  "In 2–4 sentences explain: what the term/entity/concept is, why it matters in the current context, and any essential background a general reader needs. " +
  "Rules: write in clear flowing prose; spell out acronyms on first use; stay under 80 words; no bullet points or markdown.";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body    = await req.json().catch(() => ({}));
  const term    = ((body.term    as string) ?? "").slice(0, 300).trim();
  const context = ((body.context as string) ?? "").slice(0, 2000);

  if (!term) return new Response("Bad request", { status: 400 });

  try {
    const response = await openai.chat.completions.create({
      model: EXPLAIN_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `User selected: "${term}"\n\nBrief context:\n${context}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const explanation = response.choices[0]?.message?.content?.trim() ?? "";
    return Response.json({ explanation, sources: [] });
  } catch {
    return new Response("Explain failed", { status: 500 });
  }
}
