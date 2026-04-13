"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CollapsibleBullet } from "./CollapsibleBullet";

function PendingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
      <span className="inline-flex gap-0.5 items-center">
        <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" />
      </span>
      <span>{label}</span>
    </div>
  );
}

const HEADLINE_MARKER = "<!--BB_HEADLINE-->";
const DIFF_MARKER     = "<!--BB_DIFF-->";

type Parsed = {
  bullets:  string;
  // undefined = marker not yet received (still generating)
  // null      = marker received, no content
  // string    = marker received with content
  streamedDiff:     string | null | undefined;
  streamedHeadline: string | null | undefined;
};

function parseStream(raw: string): Parsed {
  const diffIdx = raw.indexOf(DIFF_MARKER);
  if (diffIdx === -1) return { bullets: raw, streamedDiff: undefined, streamedHeadline: undefined };

  const bullets   = raw.slice(0, diffIdx).trim();
  const afterDiff = raw.slice(diffIdx + DIFF_MARKER.length);
  const hlIdx     = afterDiff.indexOf(HEADLINE_MARKER);

  if (hlIdx === -1) {
    return { bullets, streamedDiff: afterDiff.trim() || null, streamedHeadline: undefined };
  }

  return {
    bullets,
    streamedDiff:     afterDiff.slice(0, hlIdx).trim() || null,
    streamedHeadline: afterDiff.slice(hlIdx + HEADLINE_MARKER.length).trim() || null,
  };
}

type Props = {
  topicKey:        string;
  initialContent:  string | null;
  initialHeadline: string | null;
  diffSummary:     string | null;
};

export function DailyBriefPanel({ topicKey, initialContent, initialHeadline, diffSummary }: Props) {
  const [rawContent, setRawContent] = useState(initialContent ?? "");
  const [loading, setLoading] = useState(!initialContent);

  const { bullets, streamedDiff, streamedHeadline } = initialContent
    ? { bullets: initialContent, streamedDiff: undefined, streamedHeadline: undefined }
    : parseStream(rawContent);

  // Cached path: use props directly. Fresh path: use parsed stream values.
  const headline    = initialContent ? initialHeadline    : streamedHeadline;
  const activeDiff  = initialContent ? diffSummary        : streamedDiff;
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialContent) return; // cache hit — nothing to do

    const controller = new AbortController();

    async function fetchBrief() {
      setRawContent("");
      setError("");
      setLoading(true);

      try {
        const res = await fetch(`/api/daily-brief?topic=${encodeURIComponent(topicKey)}`, {
          signal: controller.signal,
        });

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
          if (done) break;
          setRawContent((prev) => prev + decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchBrief();
    return () => { controller.abort(); };
  }, [initialContent]);

  if (loading && !rawContent) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-6">
        <span className="animate-pulse">Generating brief…</span>
      </div>
    );
  }

  if (error) {
    return <p className="mt-6 text-sm text-red-500 dark:text-red-400">{error}</p>;
  }

  const showHeadlineSpinner = loading && !!bullets && headline === undefined;
  const showDiffSpinner     = loading && !!bullets && streamedDiff === undefined && !initialContent;

  return (
    <div className="mt-2 space-y-6">
      {/* Witty headline */}
      {showHeadlineSpinner ? (
        <PendingIndicator label="Generating headline…" />
      ) : headline ? (
        <p className="text-sm italic text-zinc-500 dark:text-zinc-400">{headline}</p>
      ) : null}

      {/* Brief bullets */}
      <ReactMarkdown
        components={{
          ul: ({ children }) => <ul className="space-y-3">{children}</ul>,
          li: ({ node, children }) => node
            ? <CollapsibleBullet node={node}>{children}</CollapsibleBullet>
            : <li>{children}</li>,
          p: ({ children }) => <span>{children}</span>,
        }}
      >
        {bullets}
      </ReactMarkdown>
      {loading && (
        <span className="inline-block w-1 h-4 ml-1 bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
      )}

      {/* Diff section */}
      {showDiffSpinner ? (
        <PendingIndicator label="Checking for changes…" />
      ) : activeDiff ? (
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
            {activeDiff}
          </ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}
