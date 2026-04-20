"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TooltipCoachmark } from "./TooltipCoachmark";

const DONE = 99;
const LOCAL_KEY = "te:coachmark_step";

function readLocalStep(): number {
  const v = localStorage.getItem(LOCAL_KEY);
  if (v === "done") return DONE;
  const n = parseInt(v ?? "0", 10);
  return isNaN(n) ? 0 : n;
}

function saveLocalStep(n: number) {
  localStorage.setItem(LOCAL_KEY, n === DONE ? "done" : String(n));
}

export function AppTooltips() {
  const pathname = usePathname();
  const [step, setStepState] = useState<number>(-1); // -1 = not yet loaded

  // On mount: check DB first; fall back to localStorage for in-progress state
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/coachmark");
        const { done } = await res.json();
        if (done) {
          // Already completed server-side — skip entirely
          saveLocalStep(DONE);
          setStepState(DONE);
        } else {
          // Not done in DB — use localStorage for the current step
          setStepState(readLocalStep());
        }
      } catch {
        // Network error — fall back to localStorage
        setStepState(readLocalStep());
      }
    }
    init();
  }, []);

  // Step 2 → 3: when user navigates to /explore
  useEffect(() => {
    if (step === 2 && pathname === "/explore") {
      saveLocalStep(3);
      setStepState(3);
    }
  }, [pathname, step]);

  // Listen for swipe event to advance step 1 → 2
  useEffect(() => {
    const onSwipe = () => {
      setStepState((prev) => {
        if (prev === 1) {
          saveLocalStep(2);
          return 2;
        }
        return prev;
      });
    };
    window.addEventListener("te:swiped", onSwipe);
    return () => window.removeEventListener("te:swiped", onSwipe);
  }, []);

  // Listen for admin reset — re-read step from localStorage immediately
  useEffect(() => {
    const onReset = () => setStepState(readLocalStep());
    window.addEventListener("te:reset", onReset);
    return () => window.removeEventListener("te:reset", onReset);
  }, []);

  async function advance(next: number) {
    saveLocalStep(next);
    setStepState(next);
    if (next === DONE) {
      // Persist completion to the DB so it won't show again on any device
      try { await fetch("/api/coachmark", { method: "POST" }); } catch { /* swallow */ }
    }
  }

  if (step < 0 || step === DONE) return null;

  if (step === 0 && pathname === "/daily-brief") {
    return (
      <TooltipCoachmark
        anchorSelector='[data-te-id="nav-daily-brief"]'
        text="Your daily brief — updated every 4 hours with the latest developments for each coverage you track."
        placement="below"
        onDismiss={() => advance(1)}
      />
    );
  }

  if (step === 1 && pathname === "/daily-brief") {
    return (
      <TooltipCoachmark
        anchorSelector='[data-te-id="slide-area"]'
        text="Swipe left to browse your coverages. Tap the dots at the bottom to jump between them."
        placement="swipe"
        onDismiss={() => advance(2)}
      />
    );
  }

  if (step === 2 && pathname === "/daily-brief") {
    return (
      <TooltipCoachmark
        anchorSelector='[data-te-id="nav-explore"]'
        text="Head to Explore to browse the source articles behind your briefs."
        placement="below"
        onDismiss={() => advance(DONE)}
      />
    );
  }

  if (step === 3 && pathname === "/explore") {
    return (
      <TooltipCoachmark
        anchorSelector='[data-te-id="explore-heading"]'
        text="Filter and browse all ingested articles. Use Synthesize to generate a focused analysis from the articles that matter to you."
        placement="below"
        onDismiss={() => advance(DONE)}
      />
    );
  }

  return null;
}
