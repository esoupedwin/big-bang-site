"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

type Phase = "hidden" | "button" | "loading" | "result" | "error";

interface Props {
  contentRef: React.RefObject<HTMLDivElement | null>;
  context:    string;
}

export function ExplainPopover({ contentRef, context }: Props) {
  const [phase,       setPhase]       = useState<Phase>("hidden");
  const [buttonPos,   setButtonPos]   = useState<{ left: number; top: number } | null>(null);
  const [explanation, setExplanation] = useState("");
  const [mounted,     setMounted]     = useState(false);

  // Stable refs used inside event handlers to avoid stale closures
  const phaseRef       = useRef<Phase>("hidden");
  const capturedTerm   = useRef("");  // holds selected text even after selection clears

  function syncPhase(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  useEffect(() => { setMounted(true); }, []);

  // ── Selection detection ──────────────────────────────────────────────────
  useEffect(() => {
    const onSelectionChange = () => {
      // Don't interfere while we're loading or showing a result
      if (phaseRef.current === "loading" || phaseRef.current === "result") return;

      const sel  = window.getSelection();
      const text = sel?.toString().trim() ?? "";

      if (!text || text.length < 2 || text.length > 300) {
        syncPhase("hidden");
        setButtonPos(null);
        return;
      }

      // Scope to the panel content area
      const anchor = sel?.anchorNode;
      if (!anchor || !contentRef.current?.contains(anchor)) {
        syncPhase("hidden");
        setButtonPos(null);
        return;
      }

      try {
        const range = sel!.getRangeAt(0);
        const rect  = range.getBoundingClientRect();

        const BUTTON_W = 90;
        const BUTTON_H = 32;
        const MARGIN   = 8;

        const left = Math.max(
          MARGIN,
          Math.min(window.innerWidth - BUTTON_W - MARGIN, rect.left + rect.width / 2 - BUTTON_W / 2)
        );
        // Prefer below; flip above if too close to bottom
        const top = rect.bottom + MARGIN + BUTTON_H > window.innerHeight - MARGIN
          ? rect.top - BUTTON_H - MARGIN
          : rect.bottom + MARGIN;

        capturedTerm.current = text;
        setButtonPos({ left, top });
        syncPhase("button");
      } catch {
        // getBoundingClientRect can throw on detached ranges — ignore
      }
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRef]);

  // ── Explain handler ──────────────────────────────────────────────────────
  async function handleExplain() {
    const term = capturedTerm.current;
    if (!term) return;

    syncPhase("loading");

    try {
      const res = await fetch("/api/explain", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ term, context }),
      });
      if (!res.ok) throw new Error("explain failed");
      const data = await res.json();
      setExplanation(data.explanation ?? "");
      syncPhase("result");
    } catch {
      syncPhase("error");
      // Auto-reset error after 3 s so the button reappears
      setTimeout(() => {
        if (phaseRef.current === "error") syncPhase("button");
      }, 3000);
    }
  }

  function dismiss() {
    syncPhase("hidden");
    setButtonPos(null);
    setExplanation("");
    window.getSelection()?.removeAllRanges();
  }

  if (!mounted) return null;

  const term = capturedTerm.current;

  return createPortal(
    <>
      {/* ── Floating "Explain" button ──────────────────────────────────── */}
      {(phase === "button" || phase === "loading" || phase === "error") && buttonPos && (
        <button
          // onPointerDown fires before selectionchange collapses the selection,
          // locking phase to "loading" so the handler ignores the collapse.
          onPointerDown={() => {
            if (phase === "button") syncPhase("loading");
          }}
          onClick={handleExplain}
          disabled={phase === "loading"}
          style={{ position: "fixed", left: buttonPos.left, top: buttonPos.top, zIndex: 60 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-all select-none ${
            phase === "error"
              ? "bg-red-500 text-white"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
          }`}
        >
          {phase === "loading" ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
              Explaining…
            </>
          ) : phase === "error" ? (
            "Failed — tap to retry"
          ) : (
            <>
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Explain
            </>
          )}
        </button>
      )}

      {/* ── Result bottom sheet ────────────────────────────────────────── */}
      {phase === "result" && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40"
            onClick={dismiss}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl flex flex-col max-h-[55vh]">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-3 pb-3 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">
                  Explaining
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  &ldquo;{term}&rdquo;
                </p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Close"
                className="p-1 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto">
              <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}
