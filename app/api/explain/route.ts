import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { EXPLAIN_MODEL } from "@/lib/prompts";

export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are a knowledgeable educator helping someone understand a term or phrase from a geopolitical brief. " +
  "Use web search to retrieve current, accurate information. " +
  "Explain in 2–4 clear sentences: what the term/entity/concept is, the essential background a general reader needs, and why it matters in the current geopolitical context. " +
  "Rules: write in plain, accessible prose; spell out acronyms on first use; stay under 90 words; no bullet points or markdown formatting.";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body    = await req.json().catch(() => ({}));
  const term    = ((body.term    as string) ?? "").slice(0, 300).trim();
  const context = ((body.context as string) ?? "").slice(0, 2000);

  if (!term) return new Response("Bad request", { status: 400 });

  try {
    const response = await openai.responses.create({
      model: EXPLAIN_MODEL,
      tools: [{ type: "web_search" as "web_search_preview" }],
      input: `User selected this term from a geopolitical brief: "${term}"\n\nBrief context:\n${context}\n\n${SYSTEM_PROMPT}`,
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
      // Sources are optional
    }

    return Response.json({ explanation, sources });
  } catch {
    return new Response("Explain failed", { status: 500 });
  }
}
