"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  topicKey:       string;
  initialContent: string | null;
  diffSummary:    string | null;
};

export function DailyBriefPanel({ topicKey, initialContent, diffSummary }: Props) {
  const [content, setContent] = useState(initialContent ?? "");
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialContent) return; // cache hit — nothing to do

    let cancelled = false;

    async function fetchBrief() {
      setContent("");
      setError("");
      setLoading(true);

      try {
        const res = await fetch(`/api/daily-brief?topic=${encodeURIComponent(topicKey)}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Failed to generate brief.");
          return;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          setContent((prev) => prev + decoder.decode(value, { stream: true }));
        }
      } catch {
        if (!cancelled) setError("An unexpected error occurred.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBrief();
    return () => { cancelled = true; };
  }, [initialContent]);

  if (loading && !content) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-6">
        <span className="animate-pulse">Generating brief…</span>
      </div>
    );
  }

  if (error) {
    return <p className="mt-6 text-sm text-red-500 dark:text-red-400">{error}</p>;
  }

  return (
    <div className="mt-2 space-y-6">
      {/* Diff section — shown when cached brief has a diff assessment */}
      {diffSummary && (
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300">
          <ReactMarkdown
            components={{
              p:      ({ children }) => <p className="leading-relaxed">{children}</p>,
              strong: ({ children }) => <span className="font-semibold text-zinc-900 dark:text-white">{children}</span>,
              ul:     ({ children }) => <ul className="mt-2 space-y-1">{children}</ul>,
              li:     ({ children }) => (
                <li className="flex gap-2 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                  <span>{children}</span>
                </li>
              ),
            }}
          >
            {diffSummary}
          </ReactMarkdown>
        </div>
      )}

      {/* Brief bullets */}
      <ReactMarkdown
        components={{
          ul: ({ children }) => <ul className="space-y-3">{children}</ul>,
          li: ({ children }) => (
            <li className="flex gap-3 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
              <span>{children}</span>
            </li>
          ),
          p: ({ children }) => <span>{children}</span>,
        }}
      >
        {content}
      </ReactMarkdown>
      {loading && (
        <span className="inline-block w-1 h-4 ml-1 bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
      )}
    </div>
  );
}
