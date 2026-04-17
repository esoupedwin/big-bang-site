const STREAM_HEADERS = { "Content-Type": "text/plain; charset=utf-8" } as const;

/**
 * Wraps any async-iterable stream (OpenAI chat completions or Responses API)
 * into a plain-text streaming Response. Supply a getText extractor suited to
 * the stream type — use chatCompletionText or responsesApiText below.
 */
export function streamingTextResponse(
  stream: AsyncIterable<unknown>,
  getText: (chunk: unknown) => string
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = getText(chunk);
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
  return new Response(readable, { headers: STREAM_HEADERS });
}

/** Text extractor for openai.chat.completions.create({ stream: true }) */
export function chatCompletionText(chunk: unknown): string {
  const c = chunk as { choices: Array<{ delta: { content?: string | null } }> };
  return c.choices[0]?.delta?.content ?? "";
}

/** Text extractor for openai.responses.create({ stream: true }) */
export function responsesApiText(event: unknown): string {
  const e = event as { type: string; delta?: string };
  return e.type === "response.output_text.delta" ? (e.delta ?? "") : "";
}
