"use client";

import { useEffect, useState } from "react";

type Props = {
  topicKey:    string;
  label:       string;
  content:     string;
  generatedAt: string | null;
};

const CACHE_KEY = (k: string, ts: string) => `analytical-take:${k}:${ts}`;
const CACHE_PREFIX = (k: string) => `analytical-take:${k}:`;

function readCache(topicKey: string, generatedAt: string): string {
  return sessionStorage.getItem(CACHE_KEY(topicKey, generatedAt)) ?? "";
}

function writeCache(topicKey: string, generatedAt: string, value: string) {
  // Clear any stale entries for this topic before writing the new one
  Object.keys(sessionStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX(topicKey)))
    .forEach((k) => sessionStorage.removeItem(k));
  sessionStorage.setItem(CACHE_KEY(topicKey, generatedAt), value);
}

export function AnalyticalTakeSection({ topicKey, label, content, generatedAt }: Props) {
  const cacheTs = generatedAt ?? "none";

  const [text,    setText]    = useState(() =>
    typeof window !== "undefined" ? readCache(topicKey, cacheTs) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [retry,   setRetry]   = useState(0);

  useEffect(() => {
    if (readCache(topicKey, cacheTs)) return;

    const signal = { cancelled: false };
    setLoading(true);
    setText("");
    setError("");

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
        if (!signal.cancelled && accumulated) writeCache(topicKey, cacheTs, accumulated);
        setLoading(false);
      })
      .catch(() => { if (!signal.cancelled) { setError("Failed to generate."); setLoading(false); } });

    return () => { signal.cancelled = true; };
  }, [topicKey, label, content, cacheTs, retry]);

  return (
    <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
        Developments Over Time
      </p>

      {loading && !text && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
          <span className="animate-pulse">Analysing developments…</span>
        </div>
      )}

      {(text || loading) && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
          {text}
          {loading && (
            <span className="inline-block w-0.5 h-3.5 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </p>
      )}

      {error && (
        <div className="flex items-center gap-3">
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={() => { setError(""); setText(""); setRetry(r => r + 1); }}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
