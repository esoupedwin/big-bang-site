"use client";

import { useEffect, useRef, useState } from "react";

type PlayerState = "idle" | "loading" | "playing" | "paused";

const STEP_LABELS = [
  "Step 1 of 2 — Generating script…",
  "Step 2 of 2 — Converting to speech…",
];

type Props = {
  label:    string;
  headline: string | null;
  content:  string;
  diff:     string | null;
};

function HeadphonesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

export function AudioBriefPlayer({ label, headline, content, diff }: Props) {
  const [state,      setState]      = useState<PlayerState>("idle");
  const [stepLabel,  setStepLabel]  = useState(STEP_LABELS[0]);
  const [progress,   setProgress]   = useState(0);
  const [error,      setError]      = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef   = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function cleanup() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setProgress(0);
  }

  function attachHandlers(audio: HTMLAudioElement) {
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    audio.onended = () => {
      audioRef.current = null;
      setProgress(0);
      setState("idle");
    };
    audio.onerror = () => {
      cleanup();
      setError("Playback error.");
      setState("idle");
    };
  }

  async function handlePlay() {
    setError("");

    // Replay from cached blob — no re-fetch needed
    if (urlRef.current) {
      const audio = new Audio(urlRef.current);
      audioRef.current = audio;
      attachHandlers(audio);
      audio.play().catch(() => { setError("Playback error."); setState("idle"); });
      setState("playing");
      return;
    }

    setStepLabel(STEP_LABELS[0]);
    setState("loading");

    // Unlock audio synchronously within the user gesture — mobile browsers
    // (iOS Safari, Android Chrome) block play() called after any async gap.
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    audio.volume = 0;
    audio.play().catch(() => {});
    audioRef.current = audio;

    try {
      // Step 1: generate spoken script
      const scriptRes = await fetch("/api/audio-brief/script", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          label,
          headline: headline ?? "",
          content,
          diff: diff ?? "",
        }),
      });

      if (!scriptRes.ok) throw new Error("Failed to generate script.");
      const { script } = await scriptRes.json();

      // Step 2: convert script to speech
      setStepLabel(STEP_LABELS[1]);
      const ttsRes = await fetch("/api/audio-brief/tts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ script }),
      });

      if (!ttsRes.ok) throw new Error("Failed to generate audio.");

      const blob = await ttsRes.blob();
      const url  = URL.createObjectURL(blob);
      urlRef.current = url;

      // Reuse the already-unlocked element with the real audio source
      audio.pause();
      audio.volume = 1;
      audio.src = url;
      audio.load();

      attachHandlers(audio);

      await audio.play();
      setState("playing");
    } catch {
      cleanup();
      setError("Could not generate audio. Please try again.");
      setState("idle");
    }
  }

  function handlePause() {
    audioRef.current?.pause();
    setState("paused");
  }

  function handleResume() {
    audioRef.current?.play();
    setState("playing");
  }

  function handleStop() {
    cleanup();
    setState("idle");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Play / loading button */}
        {state === "idle" && (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <HeadphonesIcon />
            Audio Brief
          </button>
        )}

        {state === "loading" && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin shrink-0" />
            {stepLabel}
          </div>
        )}

        {(state === "playing" || state === "paused") && (
          <>
            {/* Pause / Resume */}
            <button
              onClick={state === "playing" ? handlePause : handleResume}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
              aria-label={state === "playing" ? "Pause" : "Resume"}
            >
              {state === "playing" ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Stop */}
            <button
              onClick={handleStop}
              className="flex items-center justify-center w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-400 transition-colors"
              aria-label="Stop"
            >
              <StopIcon />
            </button>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-600 dark:bg-zinc-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
