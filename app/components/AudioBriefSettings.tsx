"use client";

import { useState, useTransition } from "react";
import { saveAudioBriefPreferences } from "@/app/actions/preferences";
import type { AudioBriefGender, AudioBriefTone } from "@/lib/preferences";

const GENDERS: { value: AudioBriefGender; label: string }[] = [
  { value: "male",   label: "Male"   },
  { value: "female", label: "Female" },
];

const TONES: { value: AudioBriefTone; label: string; description: string }[] = [
  {
    value:       "news_reporter",
    label:       "News Reporter",
    description: "Neutral, factual, concise — like a radio bulletin",
  },
  {
    value:       "conversational_companion",
    label:       "Conversational Companion",
    description: "Relaxed and natural — like someone talking you through it",
  },
  {
    value:       "urgent_alert",
    label:       "Urgent Alert Mode",
    description: "Sharp and direct — highlights risks and escalation fast",
  },
  {
    value:       "explainer",
    label:       "Explainer",
    description: "Clear and jargon-light — briefly explains context",
  },
];

type Props = {
  initialGender: AudioBriefGender;
  initialTone:   AudioBriefTone;
};

export function AudioBriefSettings({ initialGender, initialTone }: Props) {
  const [gender,     setGender]     = useState<AudioBriefGender>(initialGender);
  const [tone,       setTone]       = useState<AudioBriefTone>(initialTone);
  const [isPending,  startTransition] = useTransition();
  const [saved,      setSaved]      = useState(false);

  function handleGender(value: AudioBriefGender) {
    setGender(value);
    setSaved(false);
  }

  function handleTone(value: AudioBriefTone) {
    setTone(value);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveAudioBriefPreferences(gender, tone);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-5">
      {/* Voice gender */}
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Voice</p>
        <div className="flex gap-3">
          {GENDERS.map(({ value, label }) => {
            const active = gender === value;
            return (
              <button
                key={value}
                onClick={() => handleGender(value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice tone */}
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Tone</p>
        <div className="grid grid-cols-1 gap-2">
          {TONES.map(({ value, label, description }) => {
            const active = tone === value;
            return (
              <button
                key={value}
                onClick={() => handleTone(value)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  active
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                }`}
              >
                <span className="block font-medium">{label}</span>
                <span className={`block text-xs mt-0.5 ${active ? "opacity-70" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Saving…" : saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
