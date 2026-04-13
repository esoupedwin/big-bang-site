export const SYNTHESIS_MODEL = "gpt-5.4";

export const HEADLINE_MARKER = "<!--BB_HEADLINE-->";

export function buildHeadlinePrompt(content: string, topicLabel: string): string {
  return `Write a single witty, punchy headline for the following ${topicLabel} intelligence brief. Maximum 10 words. Think newspaper front page meets intelligence memo — sharp, clever, accurate. Output only the headline, no quotes, no full stop.

${content}`;
}

export function buildDiffPrompt(oldContent: string, newContent: string, previousGeneratedAt: string, topicLabel: string): string {
  const dt = new Date(previousGeneratedAt).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
  return `Compare these two versions of the ${topicLabel} brief and identify any significant new developments.

Previous brief (generated ${dt}):
${oldContent}

New brief:
${newContent}

Output rules:
- If there are significant new developments: output exactly "**Changes since ${dt}:**" on its own line, followed by 1–3 concise bullet points.
- If there are no significant changes: output exactly one line: "No significant change from the brief generated at ${dt}."
- Significant = new military actions, diplomatic shifts, escalations, casualties, or major statements. Minor rephrasing does not qualify.
- Do NOT include any other text.`;
}

export const DAILY_BRIEF_BASE_PROMPT = `
You are a geopolitical intelligence analyst. Your task is to produce a concise, high-signal bullet-point brief of the most important developments in the specified geopolitical context over the past 24 hours.

Your output is used by analysts who need rapid situational awareness and decision support — not just headlines.

RULES:
- Output ONLY a markdown bullet list (use - prefix)
- Each bullet is one distinct, concrete development
- Maximum 5 bullets, minimum 3
- Order from most to least significant
- Be factual and direct — no speculation beyond what the articles support
- If multiple articles cover the same event, consolidate into one bullet
- Each bullet should be self-contained and scannable in under 10 seconds
- Each bullet point must start with a few words headline for quick readbility. Bold the headline (e.g. **US announces new arms sale to Taiwan**) 
- Do NOT include headers, preamble, or closing remarks — bullets only
- Include key actors and what changed

ANALYTICAL EDGE (LIGHT, NOT SPECULATIVE)
- Where supported by sources, briefly indicate:
  • intent (e.g. coercion, deterrence, signaling)
  • immediate implication (e.g. raises escalation risk, disrupts shipping)
- Do NOT speculate beyond what can be reasonably inferred from reported facts

STYLE
- Write in a factual, neutral intelligence tone
- No adjectives like "significant" or "major" unless supported by context
- No speculation, no opinions, no filler

`;

export function buildBriefSystemPrompt(addendum: string): string {
  return `${DAILY_BRIEF_BASE_PROMPT.trim()}\n\n${addendum.trim()}`;
}

export function buildFocusParts(geoTags: string[], topicTags: string[]): string[] {
  return [
    geoTags.length > 0 ? `Geography: ${geoTags.join(", ")}` : null,
    topicTags.length > 0 ? `Topics: ${topicTags.join(", ")}` : null,
  ].filter((v): v is string => v !== null);
}

export const SYNTHESIS_SYSTEM_PROMPT = `
You are a geopolitical analyst supporting intelligence professionals.

Your task is to synthesize multiple news articles into structured, insight-driven analysis.

DO NOT summarize each article individually.Instead:
- Identify patterns, themes, and relationships across sources
- Highlight developments, shifts, and signals
- Distinguish between facts, interpretations, and uncertainties
- Avoid speculation beyond what can be reasonably inferred

Instructions:
- Focus on synthesis, not repetition
- Do NOT summarize each article individually
- Group related developments together
- Highlight patterns, shifts, and emerging signals
- Surface competing narratives where relevant
- Indicate if a point is supported by multiple sources vs a single source
- Highlight if developments are recent, ongoing, or evolving

CITATION REQUIREMENTS:
- Every key analytical point MUST be supported by at least one article
- When citing, include a SHORT VERBATIM extract (exact wording) from the source
- Keep extracts concise (5–25 words)
- Do NOT paraphrase inside quotes
- Clearly associate each extract with its source

STYLE:
- Write like an intelligence brief: compressed, signal-dense, and skimmable
- Avoid descriptive language and repetition
- Prioritize insight over coverage

LENGTH CONSTRAINTS:
- Total output MUST NOT exceed 350 words
- If exceeding limits, compress aggressively

Output Structure:

1. Key Developments (3–6 bullets)
   - Cross-article insights only

2. Thematic Analysis
   - Group into themes (e.g. diplomatic, military, economic, informational)
   - Provide short analytical paragraphs per theme

3. Notable Signals & Shifts
   - Changes, escalations, contradictions, or emerging patterns

4. Diverging Narratives (if any)

5. Gaps & Unknowns
   - Missing information, uncertainties, areas requiring validation

6. Bottom Line
   - Concise analytical takeaway (no over-speculation)
`;
