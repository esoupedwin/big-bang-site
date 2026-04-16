"use client";

import { useState, useRef } from "react";
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

const SWIPE_THRESHOLD = 50; // px

export function DailyBriefCarousel({ slides }: { slides: TopicSlide[] }) {
  const [index,     setIndex]     = useState(0);
  const [dragX,     setDragX]     = useState(0);
  const [dragging,  setDragging]  = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const canPrev = index > 0;
  const canNext = index < slides.length - 1;

  function goTo(i: number) {
    setIndex(Math.max(0, Math.min(slides.length - 1, i)));
  }

  // ── Touch handlers ────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Ignore if primarily vertical (user is scrolling content)
    if (!dragging && Math.abs(dy) > Math.abs(dx)) return;
    setDragging(true);
    setDragX(dx);
  }

  function onTouchEnd() {
    if (dragging) {
      if      (dragX < -SWIPE_THRESHOLD && canNext) goTo(index + 1);
      else if (dragX >  SWIPE_THRESHOLD && canPrev) goTo(index - 1);
    }
    setDragX(0);
    setDragging(false);
    touchStartX.current = null;
    touchStartY.current = null;
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* ── Slide track ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden min-h-0 w-full"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
          {slides.map(({ topicKey, label, geoTags, topicTags, articleCount, articles, cachedContent, cachedDiff, cachedAt, cachedHeadline }, i) => (
            <div
              key={topicKey}
              className="absolute top-0 left-0 w-full h-full overflow-y-auto overflow-x-hidden"
              style={{
                transform:  `translateX(calc(${(i - index) * 100}% + ${dragX}px))`,
                transition: dragging ? "none" : "transform 300ms ease-in-out",
                willChange: "transform",
              }}
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
            className={`
              hidden md:flex items-center justify-center
              fixed left-4 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full border shadow-sm transition-all duration-200
              bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700
              text-zinc-600 dark:text-zinc-300
              hover:bg-zinc-50 dark:hover:bg-zinc-800
              disabled:opacity-0 disabled:pointer-events-none
            `}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <button
            onClick={() => goTo(index + 1)}
            disabled={!canNext}
            aria-label="Next coverage"
            className={`
              hidden md:flex items-center justify-center
              fixed right-4 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full border shadow-sm transition-all duration-200
              bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700
              text-zinc-600 dark:text-zinc-300
              hover:bg-zinc-50 dark:hover:bg-zinc-800
              disabled:opacity-0 disabled:pointer-events-none
            `}
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
              className={`
                pointer-events-auto w-1.5 h-1.5 rounded-full transition-all duration-200
                ${i === index
                  ? "bg-zinc-900 dark:bg-white scale-125"
                  : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-500 dark:hover:bg-zinc-400"}
              `}
            />
          ))}
        </div>
      )}

    </div>
  );
}
