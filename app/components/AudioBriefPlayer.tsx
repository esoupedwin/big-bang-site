"use client";

import { useEffect, useRef, useState } from "react";
import { awardAchievementAction } from "@/app/actions/achievements";
import type { Achievement } from "@/lib/achievements";
import { AchievementToast } from "./AchievementToast";

type PlayerState = "idle" | "loading" | "playing" | "paused" | "done";

const STEP_LABELS = [
  "Step 1 of 2 — Generating script…",
  "Step 2 of 2 — Converting to speech…",
];

type Props = {
  topicKey:     string;
  label:        string;
  headline:     string | null;
  content:      string;
  diff:         string | null;
  voiceGender:  string;
  voiceTone:    string;
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

function ReplayIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    </svg>
  );
}

export function AudioBriefPlayer({ topicKey, label, headline, content, diff, voiceGender, voiceTone }: Props) {
  const [state,          setState]          = useState<PlayerState>("idle");
  const [stepLabel,      setStepLabel]      = useState(STEP_LABELS[0]);
  const [progress,       setProgress]       = useState(0);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [error,          setError]          = useState("");
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const urlRef         = useRef<string | null>(null);
  const prevContentRef = useRef(content);

  // Reset player when the brief content changes (new generation)
  useEffect(() => {
    if (content === prevContentRef.current) return;
    prevContentRef.current = content;
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setState("idle");
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [content]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, "0")}`;
  }

  function cleanup() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }

  function attachHandlers(audio: HTMLAudioElement) {
    audio.onplaying = () => setState("playing");
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
        setCurrentTime(audio.currentTime);
      }
    };
    audio.onended = () => {
      audioRef.current = null;
      setProgress(1);
      setState("done");
      awardAchievementAction("disc_jockey").then((earned) => {
        if (earned) setNewAchievement(earned);
      });
    };
    audio.onerror = () => {
      cleanup();
      setError("Playback error.");
      setState("idle");
    };
  }

  function playFromCache() {
    if (!urlRef.current) return false;
    const audio = new Audio(urlRef.current);
    audioRef.current = audio;
    attachHandlers(audio);
    audio.play().catch(() => { setError("Playback error."); setState("idle"); });
    setState("playing");
    return true;
  }

  async function handlePlay() {
    setError("");
    if (playFromCache()) return;

    setStepLabel(STEP_LABELS[0]);
    setState("loading");

    // Unlock audio synchronously within the user gesture — mobile browsers
    // block play() called after any async gap.
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    audio.volume = 0;
    audio.play().catch(() => {});
    audioRef.current = audio;

    try {
      // Step 1: generate (or fetch cached) spoken script
      const scriptRes = await fetch("/api/audio-brief/script", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          topicKey,
          label,
          headline: headline ?? "",
          content,
          diff: diff ?? "",
          tone: voiceTone,
        }),
      });

      if (!scriptRes.ok) throw new Error("Failed to generate script.");
      const { script } = await scriptRes.json();

      // Step 2: convert script to speech
      setStepLabel(STEP_LABELS[1]);
      const ttsRes = await fetch("/api/audio-brief/tts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ script, gender: voiceGender }),
      });

      if (!ttsRes.ok) throw new Error("Failed to generate audio.");

      const blob = await ttsRes.blob();
      const url  = URL.createObjectURL(blob);
      urlRef.current = url;

      audio.pause();
      audio.volume = 1;
      audio.src = url;
      audio.load();

      attachHandlers(audio);

      audio.play().catch(() => {
        cleanup();
        setError("Could not start playback. Please try again.");
        setState("idle");
      });
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

  function handleReplay() {
    setError("");
    setProgress(0);
    setCurrentTime(0);
    playFromCache();
  }

  return (
    <div className="flex flex-col gap-2">
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onDismiss={() => setNewAchievement(null)}
        />
      )}
      <div className="flex items-center gap-3">
        {/* Idle — first play */}
        {state === "idle" && (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <HeadphonesIcon />
            Audio Brief
          </button>
        )}

        {/* Loading */}
        {state === "loading" && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin shrink-0" />
            {stepLabel}
          </div>
        )}

        {/* Playing / paused */}
        {(state === "playing" || state === "paused") && (
          <>
            <button
              onClick={state === "playing" ? handlePause : handleResume}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
              aria-label={state === "playing" ? "Pause" : "Resume"}
            >
              {state === "playing" ? <PauseIcon /> : <PlayIcon />}
            </button>

            <button
              onClick={handleStop}
              className="flex items-center justify-center w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-400 transition-colors"
              aria-label="Stop"
            >
              <StopIcon />
            </button>

            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-600 dark:bg-zinc-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>

            <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
              {formatTime(currentTime)}{duration > 0 ? ` / ${formatTime(duration)}` : ""}
            </span>
          </>
        )}

        {/* Done — replay from cache */}
        {state === "done" && (
          <>
            <button
              onClick={handleReplay}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <ReplayIcon />
              Replay Brief
            </button>
            {duration > 0 && (
              <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                {formatTime(duration)}
              </span>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
