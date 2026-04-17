"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { buildFocusParts } from "@/lib/prompts";
import { EntryInput } from "@/lib/types";
import { awardAchievementAction } from "@/app/actions/achievements";
import type { Achievement } from "@/lib/achievements";
import { AchievementToast } from "./AchievementToast";

type Props = {
  entries: EntryInput[];
  selectedGeoTags: string[];
  selectedTopicTags: string[];
};

export function SynthesisPanel({ entries, selectedGeoTags, selectedTopicTags }: Props) {
  const [synthesis,      setSynthesis]      = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  async function handleSynthesize() {
    setSynthesis("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries, selectedGeoTags, selectedTopicTags }),
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

      // Award achievement on first successful synthesis (fire-and-forget)
      awardAchievementAction("synthesize_master").then((earned) => {
        if (earned) setNewAchievement(earned);
      });
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const focusLabel = buildFocusParts(selectedGeoTags, selectedTopicTags).join(" · ");

  return (
    <div className="mt-4">
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onDismiss={() => setNewAchievement(null)}
        />
      )}
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
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
            Geopolitical Synthesis · {entries.length} articles
          </p>
          {focusLabel && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">{focusLabel}</p>
          )}
          <div className="synthesis-prose prose prose-zinc dark:prose-invert max-w-none">
            <ReactMarkdown>{synthesis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
