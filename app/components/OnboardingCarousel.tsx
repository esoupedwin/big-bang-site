"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/app/actions/onboarding";

// ─── Slide visuals ────────────────────────────────────────────────────────────

function Visual1() {
  const tags = [
    { label: "US · Iran · Israel", color: "text-blue-400 border-blue-800 bg-blue-950" },
    { label: "China · Taiwan",     color: "text-violet-400 border-violet-800 bg-violet-950" },
    { label: "AI Landscape",       color: "text-emerald-400 border-emerald-800 bg-emerald-950" },
    { label: "Russia · Ukraine",   color: "text-amber-400 border-amber-800 bg-amber-950" },
    { label: "Indo-Pacific",       color: "text-sky-400 border-sky-800 bg-sky-950" },
    { label: "Nuclear",            color: "text-rose-400 border-rose-800 bg-rose-950" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-2.5 px-4">
      {tags.map((t) => (
        <span
          key={t.label}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${t.color}`}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

function Visual2() {
  const bullets = [
    { headline: "US expands naval presence in Hormuz", detail: "Additional carrier group deployed amid blockade enforcement.", dim: false },
    { headline: "Iran signals nuclear concession",      detail: "Indirect talks resume; enrichment freeze offered conditionally.", dim: false },
    { headline: "Israel targets proxy sites in Syria",  detail: "Third airstrike this week on Iranian-linked positions.",          dim: true  },
  ];
  return (
    <div className="w-full max-w-xs rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3.5">
      {bullets.map((b, i) => (
        <div key={i} className={`flex items-start gap-3 ${b.dim ? "opacity-35" : ""}`}>
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 leading-snug">{b.headline}</p>
            <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{b.detail}</p>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 shrink-0 mt-0.5">#{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

function Visual3() {
  return (
    <div className="w-full max-w-xs space-y-2.5">
      {/* Old item — muted */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex items-start gap-3 opacity-40">
        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-2.5 rounded-full bg-zinc-600 w-4/5" />
          <div className="h-2 rounded-full bg-zinc-700 w-3/5" />
        </div>
      </div>
      {/* New item — highlighted */}
      <div className="rounded-lg border border-amber-700/60 bg-amber-950/40 p-3 flex items-start gap-3">
        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-2.5 rounded-full bg-amber-400/70 w-full" />
          <div className="h-2 rounded-full bg-amber-700/50 w-4/5" />
        </div>
        <span className="text-[9px] font-semibold tracking-wide text-amber-400 bg-amber-950 border border-amber-700/60 px-1.5 py-0.5 rounded shrink-0">
          CHANGES
        </span>
      </div>
      {/* Another old item */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex items-start gap-3 opacity-40">
        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-2.5 rounded-full bg-zinc-600 w-3/4" />
          <div className="h-2 rounded-full bg-zinc-700 w-2/5" />
        </div>
      </div>
    </div>
  );
}

function Visual4() {
  const entries = [
    { date: "12 Apr", label: "Initial escalation",  done: true  },
    { date: "15 Apr", label: "Posture shifts",       done: true  },
    { date: "18 Apr", label: "Diplomacy opens",      done: true  },
    { date: "Now",    label: "Trajectory unclear",   done: false },
  ];
  return (
    <div className="flex flex-col items-start gap-0 pl-4">
      {entries.map((e, i) => (
        <div key={i} className="flex items-start gap-4">
          {/* Spine */}
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full border-2 mt-0.5 shrink-0 ${
                e.done
                  ? "border-zinc-400 bg-zinc-400"
                  : "border-zinc-500 bg-transparent"
              }`}
            />
            {i < entries.length - 1 && (
              <div className="w-px h-8 bg-zinc-700 mt-0.5" />
            )}
          </div>
          {/* Label */}
          <div className="pb-8 last:pb-0">
            <span className="text-[10px] font-mono text-zinc-500">{e.date}</span>
            <p className={`text-xs mt-0.5 ${e.done ? "text-zinc-300" : "text-zinc-500"}`}>
              {e.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Visual5() {
  return (
    <div className="w-full max-w-xs space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {["Geography", "Topics", "Synthesize ↗"].map((f, i) => (
          <span
            key={f}
            className={`text-[11px] px-2.5 py-1 rounded-full border ${
              i === 2
                ? "border-zinc-400 text-zinc-200 bg-zinc-800"
                : "border-zinc-700 text-zinc-400 bg-zinc-900"
            }`}
          >
            {f}
          </span>
        ))}
      </div>
      {/* Article rows */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        {[["w-4/5", "text-blue-700"], ["w-3/4", "text-violet-700"], ["w-5/6", "text-emerald-700"]].map(
          ([w, tag], i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex-1 space-y-1">
                <div className={`h-2 rounded-full bg-zinc-600 ${w}`} />
                <div className="h-1.5 rounded-full bg-zinc-800 w-1/2" />
              </div>
              <div className={`w-2 h-2 rounded-full ${tag} bg-current shrink-0`} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Visual6() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Eye symbol */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-zinc-800/60" />
        <div className="absolute inset-2 rounded-full border border-zinc-600" />
        <div className="absolute inset-5 rounded-full bg-zinc-300" />
        <div className="absolute inset-7 rounded-full bg-zinc-950" />
        {/* Glow */}
        <div className="absolute inset-0 rounded-full blur-xl bg-zinc-400/10" />
      </div>
      <p className="text-xs tracking-[0.35em] uppercase text-zinc-500 font-mono">
        Third Eye
      </p>
    </div>
  );
}

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    visual: <Visual1 />,
    title:  "Start with what matters to you",
    body:   "Choose issues you care about — conflicts, countries, or topics. Third Eye continuously tracks them for you.",
  },
  {
    visual: <Visual2 />,
    title:  "Get a daily brief",
    body:   "Each coverage is summarised into key developments from the last 24 hours — ranked by importance.",
  },
  {
    visual: <Visual3 />,
    title:  "See what changed",
    body:   "No need to reread everything. Third Eye highlights what changed since your last check — new actions, shifts, and signals.",
  },
  {
    visual: <Visual4 />,
    title:  "Track developments over time",
    body:   "Generate a timeline of key developments to understand how the situation is evolving and where it may be heading.",
  },
  {
    visual: <Visual5 />,
    title:  "Explore and go deeper",
    body:   "Read source articles, filter by topic or geography, and generate focused analysis from the news that matters to you.",
  },
  {
    visual: <Visual6 />,
    title:  "Welcome to Third Eye",
    body:   "The world hasn't slowed down. You just don't have to keep up the hard way anymore.",
  },
];

const LAST = SLIDES.length - 1;

// ─── Carousel ─────────────────────────────────────────────────────────────────

export function OnboardingCarousel() {
  const router                = useRouter();
  const [pending, startTransition] = useTransition();
  const [current,  setCurrent]  = useState(0);
  const [animKey,  setAnimKey]  = useState(0);
  const [fadeDir,  setFadeDir]  = useState<"left" | "right">("right");

  function go(next: number, dir: "left" | "right") {
    setFadeDir(dir);
    setAnimKey((k) => k + 1);
    setCurrent(next);
  }

  function finish() {
    startTransition(async () => {
      await completeOnboardingAction();
      router.push("/daily-brief");
    });
  }

  const slide = SLIDES[current];

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col">

      {/* Skip — top right */}
      {current < LAST && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={finish}
            disabled={pending}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5"
          >
            Skip
          </button>
        </div>
      )}

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <div
          key={animKey}
          className="w-full max-w-sm flex flex-col items-center text-center gap-8"
          style={{
            animation: `onboarding-slide-${fadeDir} 320ms cubic-bezier(0.25,0.46,0.45,0.94) both`,
          }}
        >
          {/* Visual */}
          <div className="flex items-center justify-center min-h-[160px]">
            {slide.visual}
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white leading-snug tracking-tight">
              {slide.title}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {slide.body}
            </p>
          </div>

          {/* Final CTA */}
          {current === LAST && (
            <button
              onClick={finish}
              disabled={pending}
              className="mt-2 px-8 py-3 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {pending ? "Loading…" : "Enter Third Eye"}
            </button>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="pb-10 px-6 flex items-center justify-between shrink-0">

        {/* Back */}
        <button
          onClick={() => go(current - 1, "left")}
          disabled={current === 0}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-0 w-16 text-left"
        >
          ← Back
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? "right" : "left")}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-zinc-600 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>

        {/* Next */}
        {current < LAST ? (
          <button
            onClick={() => go(current + 1, "right")}
            className="text-sm text-zinc-300 hover:text-white transition-colors w-16 text-right"
          >
            Next →
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes onboarding-slide-right {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes onboarding-slide-left {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
