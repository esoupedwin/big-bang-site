import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { EXPLAIN_MODEL } from "@/lib/prompts";

export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are a concise intelligence analyst. The user has highlighted a term or phrase from a geopolitical brief and wants a quick explanation. " +
  "In 2–4 sentences explain: what the term/entity/concept is, why it matters in the current context, and any essential background a general reader needs. " +
  "Rules: write in clear flowing prose; spell out acronyms on first use; stay under 80 words; no bullet points or markdown. " +
  "Use web search to ensure your answer is accurate and current.";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body    = await req.json().catch(() => ({}));
  const term    = ((body.term    as string) ?? "").slice(0, 300).trim();
  const context = ((body.context as string) ?? "").slice(0, 2000);

  if (!term) return new Response("Bad request", { status: 400 });

  const response = await openai.responses.create({
    model: EXPLAIN_MODEL,
    tools: [{ type: "web_search_preview" }],
    input: `${SYSTEM_PROMPT}\n\nUser selected: "${term}"\n\nBrief context:\n${context}`,
  });

  const explanation = response.output_text ?? "";

  // Extract URL citations from output annotations
  const sources: { title: string; url: string }[] = [];
  try {
    for (const item of response.output) {
      if ((item as { type: string }).type !== "message") continue;
      const content = (item as { content?: unknown[] }).content ?? [];
      for (const part of content) {
        if ((part as { type: string }).type !== "output_text") continue;
        const annotations = (part as { annotations?: unknown[] }).annotations ?? [];
        for (const ann of annotations) {
          const a = ann as { type: string; url?: string; title?: string };
          if (a.type === "url_citation" && a.url && !sources.some((s) => s.url === a.url)) {
            sources.push({ title: a.title ?? a.url, url: a.url });
          }
        }
      }
    }
  } catch {
    // Sources are optional — parsing errors don't fail the request
  }

  return Response.json({ explanation, sources });
}
