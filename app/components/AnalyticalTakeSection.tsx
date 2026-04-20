"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BriefHistoryDrawer } from "./BriefHistoryDrawer";

const DOT_MIN_HISTORY = 3;

type Props = {
  topicKey:     string;
  label:        string;
  content:      string;
  generatedAt:  string | null;
  historyCount: number;
};

const CACHE_KEY = (k: string, ts: string) => `analytical-take:${k}:${ts}`;
const CACHE_PREFIX = (k: string) => `analytical-take:${k}:`;

function readCache(topicKey: string, generatedAt: string): string {
  return sessionStorage.getItem(CACHE_KEY(topicKey, generatedAt)) ?? "";
}

function writeCache(topicKey: string, generatedAt: string, value: string) {
  Object.keys(sessionStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX(topicKey)))
    .forEach((k) => sessionStorage.removeItem(k));
  sessionStorage.setItem(CACHE_KEY(topicKey, generatedAt), value);
}

export function AnalyticalTakeSection({ topicKey, label, content, generatedAt, historyCount }: Props) {
  const cacheTs = generatedAt ?? "none";

  const [text,          setText]          = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [historyOpen,   setHistoryOpen]   = useState(false);

  // Rehydrate from sessionStorage after mount (useState initializer runs on the
  // server where window is undefined, so the cache read must happen in an effect).
  useEffect(() => {
    setText(readCache(topicKey, cacheTs));
  }, [topicKey, cacheTs]);

  function generate() {
    setLoading(true);
    setText("");
    setError("");

    const signal = { cancelled: false };
    let accumulated = "";

    fetch("/api/coverage/analytical-take", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ topicKey, label, content }),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) { setError("Failed to generate."); setLoading(false); return; }
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done || signal.cancelled) break;
          accumulated += decoder.decode(value, { stream: true });
          setText(accumulated);
        }
        if (signal.cancelled) return;
        if (accumulated) {
          writeCache(topicKey, cacheTs, accumulated);
        } else {
          setError("Failed to generate.");
        }
        setLoading(false);
      })
      .catch(() => { if (!signal.cancelled) { setError("Failed to generate."); setLoading(false); } });
  }

  const remaining = DOT_MIN_HISTORY - historyCount;
  if (remaining > 0) {
    return (
      <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
          Developments Over Time
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
          How this coverage has evolved over time, and where it's heading.
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          This feature activates once {DOT_MIN_HISTORY} developments have been tracked.{" "}
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
            {remaining} more {remaining === 1 ? "brief" : "briefs"} to go
          </span>{" "}
          — check back tomorrow.
        </p>
      </div>
    );
  }

  return (
    <>
    <BriefHistoryDrawer
      isOpen={historyOpen}
      onClose={() => setHistoryOpen(false)}
      topicKey={topicKey}
    />
    <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Developments Over Time
        </p>
        {!text && !loading && !error ? (
          <button
            onClick={generate}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-0.5 transition-colors"
          >
            Generate
          </button>
        ) : (
          <button
            onClick={() => setHistoryOpen(true)}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-0.5 transition-colors"
          >
            View Past Developments
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
        How this coverage has evolved over time, and where it's heading.
      </p>

      {loading && !text && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
          <span className="animate-pulse">Analysing developments…</span>
        </div>
      )}

      {(text || loading) && (
        <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-4 mb-2 first:mt-0">
                  {children}
                </h2>
              ),
              ul: ({ children }) => <ul className="space-y-3 mb-3">{children}</ul>,
              li: ({ children }) => (
                <li className="flex gap-2 text-zinc-700 dark:text-zinc-300">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                  <span className="leading-relaxed">{children}</span>
                </li>
              ),
              p: ({ children }) => (
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2">{children}</p>
              ),
              strong: ({ children }) => (
                <span className="font-semibold text-zinc-900 dark:text-white">{children}</span>
              ),
              hr: () => null,
            }}
          >
            {text}
          </ReactMarkdown>
          {loading && (
            <span className="inline-block w-0.5 h-3.5 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3">
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={() => { setError(""); generate(); }}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
    </>
  );
}
