"use client";

import { useState } from "react";

type EntryInput = {
  title: string | null;
  summary: string | null;
  gist: string | null;
};

export function SynthesisPanel({ entries }: { entries: EntryInput[] }) {
  const [synthesis, setSynthesis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSynthesize() {
    setSynthesis("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setError(error ?? "Synthesis failed.");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSynthesis((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleSynthesize}
        disabled={loading || entries.length === 0}
        className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 dark:bg-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Synthesizing…" : "Synthesize"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {synthesis && (
        <div className="mt-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
            Geopolitical Synthesis · {entries.length} articles
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {synthesis}
          </p>
        </div>
      )}
    </div>
  );
}
