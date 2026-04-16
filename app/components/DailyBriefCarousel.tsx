"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { DailyBriefPanel } from "./DailyBriefPanel";
import type { ArticleRef } from "./ArticlesDrawer";

export type TopicSlide = {
  topicKey:       string;
  label:          string;
  geoTags:        string[];
  topicTags:      string[];
  articleCount:   number;
  articles:       ArticleRef[];
  cachedContent:  string | null;
  cachedDiff:     string | null;
  cachedAt:       string | null;
  cachedHeadline: string | null;
};

// How far (px) or fast (px/ms) to commit a swipe
const DISTANCE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 0.3;
// Damping applied at the first / last slide boundary
const EDGE_RESISTANCE = 0.15;
// Snap transition — mimics iOS spring
const SNAP_TRANSITION = "transform 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";

export function DailyBriefCarousel({ slides }: { slides: TopicSlide[] }) {
  // index drives dots + arrow re-renders only — NOT transforms
  const [index, setIndex] = useState(0);
  const indexRef     = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── All touch state in refs — zero re-renders during drag ─────────────────
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastX       = useRef(0);
  const lastTime    = useRef(0);
  const velocity    = useRef(0);
  const dragX       = useRef(0);
  const dirLock     = useRef<"h" | "v" | null>(null);

  // ── Direct DOM transform — bypasses React render cycle ────────────────────
  function applyTransforms(dx: number, animated: boolean) {
    const container = containerRef.current;
    if (!container) return;
    const transition = animated ? SNAP_TRANSITION : "none";
    for (let i = 0; i < container.children.length; i++) {
      const el = container.children[i] as HTMLElement;
      el.style.transition = transition;
      el.style.transform  = `translateX(calc(${(i - indexRef.current) * 100}% + ${dx}px))`;
    }
  }

  // Set initial positions before first paint
  useLayoutEffect(() => {
    applyTransforms(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Non-passive touchmove listener — prevents iOS pull-to-refresh when the
  // current slide is at scrollTop 0 and the finger is moving downward.
  // React synthetic events are passive by default so e.preventDefault() there
  // has no effect; a native listener with { passive: false } is required.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let nativeStartY = 0;

    const onNativeTouchStart = (e: TouchEvent) => {
      nativeStartY = e.touches[0].clientY;
    };

    const onNativeTouchMove = (e: TouchEvent) => {
      const slide = container.children[indexRef.current] as HTMLElement | undefined;
      if (!slide) return;
      const dy = e.touches[0].clientY - nativeStartY;
      // Pulling down (dy > 0) while already at the top → block overscroll
      if (dy > 0 && slide.scrollTop <= 0) {
        e.preventDefault();
      }
    };

    container.addEventListener("touchstart", onNativeTouchStart, { passive: true });
    container.addEventListener("touchmove",  onNativeTouchMove,  { passive: false });
    return () => {
      container.removeEventListener("touchstart", onNativeTouchStart);
      container.removeEventListener("touchmove",  onNativeTouchMove);
    };
  }, []);

  function goTo(next: number) {
    next = Math.max(0, Math.min(slides.length - 1, next));
    indexRef.current = next;
    setIndex(next);          // re-render dots + arrows only
    applyTransforms(0, true);
  }

  // ── Touch handlers ────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    const t         = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    lastX.current       = t.clientX;
    lastTime.current    = performance.now();
    velocity.current    = 0;
    dragX.current       = 0;
    dirLock.current     = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const t   = e.touches[0];
    const dx  = t.clientX - touchStartX.current;
    const dy  = t.clientY - touchStartY.current;
    const now = performance.now();
    const dt  = now - lastTime.current;

    // Lock direction once the finger has moved 12px from origin.
    // Horizontal lock requires |dx| >= 2×|dy| (within ~27° of horizontal)
    // so diagonal and near-vertical movements always route to vertical scroll.
    if (dirLock.current === null) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 12) {
        dirLock.current = Math.abs(dx) >= Math.abs(dy) * 2 ? "h" : "v";
      }
    }
    if (dirLock.current !== "h") return;

    // Rolling velocity (px/ms)
    if (dt > 0) velocity.current = (t.clientX - lastX.current) / dt;
    lastX.current    = t.clientX;
    lastTime.current = now;

    // Edge resistance: pulling past first or last slide feels springy
    const atStart = indexRef.current === 0               && dx > 0;
    const atEnd   = indexRef.current === slides.length - 1 && dx < 0;
    const resistedDx = atStart || atEnd ? dx * EDGE_RESISTANCE : dx;

    dragX.current = resistedDx;
    applyTransforms(resistedDx, false);
  }

  function onTouchEnd() {
    if (dirLock.current !== "h") {
      resetTouchState();
      return;
    }

    const dx = dragX.current;
    const v  = velocity.current;

    const goNext = (v < -VELOCITY_THRESHOLD || dx < -DISTANCE_THRESHOLD)
                   && indexRef.current < slides.length - 1;
    const goPrev = (v >  VELOCITY_THRESHOLD || dx >  DISTANCE_THRESHOLD)
                   && indexRef.current > 0;

    if (goNext)      goTo(indexRef.current + 1);
    else if (goPrev) goTo(indexRef.current - 1);
    else             applyTransforms(0, true); // snap back to current slide

    resetTouchState();
  }

  function resetTouchState() {
    dragX.current       = 0;
    dirLock.current     = null;
    touchStartX.current = null;
    touchStartY.current = null;
    velocity.current    = 0;
  }

  if (slides.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
        No coverages configured. Add one in{" "}
        <a href="/profile/coverages" className="ml-1 underline underline-offset-2">
          Profile → Coverages
        </a>
        .
      </div>
    );
  }

  const canPrev = index > 0;
  const canNext = index < slides.length - 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* ── Slide track ─────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden min-h-0 w-full overscroll-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map(({ topicKey, label, geoTags, topicTags, articleCount, articles, cachedContent, cachedDiff, cachedAt, cachedHeadline }) => (
          <div
            key={topicKey}
            // transform/transition are managed directly via applyTransforms — not by React
            style={{ willChange: "transform" }}
            className="absolute top-0 left-0 w-full h-full overflow-y-scroll overflow-x-hidden overscroll-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">

              {/* Topic header */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{label}</h2>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {geoTags.length === 0 ? (
                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                      All Countries
                    </span>
                  ) : (
                    geoTags.map((tag) => (
                      <span key={tag} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))
                  )}
                  {topicTags.map((tag) => (
                    <span key={tag} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {articleCount === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No articles found in the last 24 hours for this topic.
                </p>
              ) : (
                <DailyBriefPanel
                  topicKey={topicKey}
                  cachedContent={cachedContent}
                  cachedHeadline={cachedHeadline}
                  cachedDiff={cachedDiff}
                  cachedAt={cachedAt}
                  articleCount={articleCount}
                  articles={articles}
                />
              )}

            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop arrow buttons (hidden on mobile) ─────────────────────── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            disabled={!canPrev}
            aria-label="Previous coverage"
            className="hidden md:flex items-center justify-center fixed left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow-sm transition-all duration-200 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <button
            onClick={() => goTo(index + 1)}
            disabled={!canNext}
            aria-label="Next coverage"
            className="hidden md:flex items-center justify-center fixed right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow-sm transition-all duration-200 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </>
      )}

      {/* ── Dot indicators ───────────────────────────────────────────────── */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 pointer-events-none z-10">
          {slides.map((s, i) => (
            <button
              key={s.topicKey}
              onClick={() => goTo(i)}
              aria-label={`Go to coverage ${i + 1}`}
              className={`pointer-events-auto w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === index
                  ? "bg-zinc-900 dark:bg-white scale-125"
                  : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-500 dark:hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
