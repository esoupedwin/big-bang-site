import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { EXPLAIN_MODEL } from "@/lib/prompts";

export const maxDuration = 30;

function buildPrompt(term: string, context: string, label: string): string {
  return `You are a knowledgeable educator helping someone understand a term or phrase from a geopolitical brief. ` +
    `The user is following the coverage topic: "${label}". ` +
    `Use web search to retrieve current, accurate information. ` +
    `Explain in 3–5 clear sentences: (1) what the term/entity/concept is and its essential background, ` +
    `(2) why it matters specifically in the context of "${label}". ` +
    `Rules: write in plain, accessible prose; spell out acronyms on first use; stay under 110 words; no bullet points or markdown formatting.\n\n` +
    `User selected: "${term}"\n\n` +
    `Brief context:\n${context}`;
}

const TIMEOUT_MS = 20_000;

export async function POST(req: NextRequest) {
  console.log("[explain] 1 — handler entered");
  const session = await auth();
  console.log("[explain] 2 — auth done, session:", !!session);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body    = await req.json().catch(() => ({}));
  const term    = ((body.term    as string) ?? "").slice(0, 300).trim();
  const context = ((body.context as string) ?? "").slice(0, 2000);
  const label   = ((body.label   as string) ?? "").slice(0, 150).trim();
  console.log("[explain] 3 — term:", term.slice(0, 40));

  if (!term) return new Response("Bad request", { status: 400 });

  const controller = new AbortController();
  const timer = setTimeout(() => {
    console.log("[explain] ⏱ timeout fired — aborting");
    controller.abort();
  }, TIMEOUT_MS);

  try {
    console.log("[explain] 4 — calling responses.create");
    const t0 = Date.now();
    const response = await openai.responses.create(
      {
        model: EXPLAIN_MODEL,
        tools: [{ type: "web_search_preview" }],
        input: [{ role: "user", content: buildPrompt(term, context, label) }],
      },
      { signal: controller.signal },
    );

    clearTimeout(timer);
    console.log("[explain] 5 — response in", Date.now() - t0, "ms");

    const explanation = response.output_text ?? "";

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
  } catch (err) {
    clearTimeout(timer);
    console.error("[explain] ✗ caught:", (err as Error)?.message ?? err);
    return new Response("Explain failed", { status: 500 });
  }
}
