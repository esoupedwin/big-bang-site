"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CollapsibleBullet } from "./CollapsibleBullet";
import { ArticlesDrawer, ArticleRef } from "./ArticlesDrawer";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { AnalyticalTakeSection } from "./AnalyticalTakeSection";
import { AudioBriefPlayer } from "./AudioBriefPlayer";
import { ExplainPopover } from "./ExplainPopover";

const UPDATING_TEXT = "Generating latest development...";
// Each cycle: 35 chars × 50 ms = 1 750 ms typing + 250 ms pause = 2 000 ms total
const CHAR_INTERVAL_MS  = 40;
const RESET_PAUSE_MS    = 1050;

function UpdatingIndicator() {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    if (pos < UPDATING_TEXT.length) {
      const t = setTimeout(() => setPos((p) => p + 1), CHAR_INTERVAL_MS);
      return () => clearTimeout(t);
    }
    // Fully typed — pause then restart
    const t = setTimeout(() => setPos(0), RESET_PAUSE_MS);
    return () => clearTimeout(t);
  }, [pos]);

  return (
    <span className="inline-flex items-center text-xs text-amber-500 dark:text-amber-400 font-mono">
      {UPDATING_TEXT.slice(0, pos)}
      <span className="inline-block w-0.5 h-3 bg-amber-400 dark:bg-amber-500 animate-pulse ml-0.5 align-text-bottom" />
    </span>
  );
}

// Extract the bold headline from a markdown bullet line.
// "- **US starts blockade**: The US Navy..." → "US starts blockade"
function extractHeadline(line: string): string {
  const match = line.match(/^[-*]\s+\*\*([^*]+)\*\*/);
  return match ? match[1] : line.replace(/^[-*]\s+/, "").replace(/\*\*/g, "");
}

type Props = {
  topicKey:       string;
  label:          string;
  cachedContent:  string | null;
  cachedHeadline: string | null;
  cachedDiff:     string | null;
  cachedAt:       string | null;
  articleCount:   number;
  articles:       ArticleRef[];
  historyCount:   number;
  voiceGender:    string;
  voiceTone:      string;
};

export function DailyBriefPanel({
  topicKey,
  label,
  cachedContent,
  cachedHeadline,
  cachedDiff,
  cachedAt,
  articleCount,
  articles,
  historyCount,
  voiceGender,
  voiceTone,
}: Props) {
  const [content,      setContent]      = useState(cachedContent);
  const [headline,     setHeadline]     = useState(cachedHeadline);
  const [diff,         setDiff]         = useState(cachedDiff);
  const [generatedAt,  setGeneratedAt]  = useState(cachedAt);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [isDrawerOpen,  setIsDrawerOpen]  = useState(false);
  const [error,         setError]         = useState("");

  // Phase 1: witty headline streams char by char
  const [animWitty,    setAnimWitty]    = useState<string | null>(null);
  const [animWittyPos, setAnimWittyPos] = useState(0);
  // Phase 2: bullet bold headlines stream char by char
  const [animBullets,   setAnimBullets]   = useState<string[] | null>(null);
  const [animHeadlines, setAnimHeadlines] = useState<string[]>([]);
  const [animBulletIdx, setAnimBulletIdx] = useState(0);
  const [animCharIdx,   setAnimCharIdx]   = useState(0);
  // Bullets content held until witty headline finishes
  const [pendingBullets, setPendingBullets] = useState<string | null>(null);

  const isAnimating  = animWitty !== null || animBullets !== null;
  const contentRef   = useRef<HTMLDivElement>(null);

  // Phase 1: stream witty headline, then hand off to bullet animation
  useEffect(() => {
    if (!animWitty) return;
    if (animWittyPos >= animWitty.length) {
      setAnimWitty(null);
      if (pendingBullets) {
        startBulletAnimation(pendingBullets);
        setPendingBullets(null);
      }
      return;
    }
    const t = setTimeout(() => setAnimWittyPos((p) => p + 1), 8);
    return () => clearTimeout(t);
  }, [animWitty, animWittyPos, pendingBullets]);

  // Phase 2: advance one character at a time; pause briefly between bullets
  useEffect(() => {
    if (!animBullets) return;

    const currentHeadline = animHeadlines[animBulletIdx] ?? "";

    if (animCharIdx < currentHeadline.length) {
      // Still typing this headline
      const t = setTimeout(() => setAnimCharIdx((c) => c + 1), 8);
      return () => clearTimeout(t);
    }

    if (animBulletIdx < animBullets.length - 1) {
      // Move to next bullet after a short pause
      const t = setTimeout(() => {
        setAnimBulletIdx((i) => i + 1);
        setAnimCharIdx(0);
      }, 40);
      return () => clearTimeout(t);
    }

    // All bullets done
    setAnimBullets(null);
  }, [animBullets, animBulletIdx, animCharIdx, animHeadlines]);

  function startBulletAnimation(newContent: string) {
    const bullets   = newContent.split("\n").filter((l) => l.trim());
    const headlines = bullets.map(extractHeadline);
    setAnimBullets(bullets);
    setAnimHeadlines(headlines);
    setAnimBulletIdx(0);
    setAnimCharIdx(0);
  }

  function applyFreshContent(data: {
    content:     string | null;
    headline:    string | null;
    diffSummary: string | null;
    generatedAt: string | null;
  }) {
    setDiff(data.diffSummary);
    setGeneratedAt(data.generatedAt);
    if (data.content) setContent(data.content);
    if (data.headline) setHeadline(data.headline);

    // Only animate if this generatedAt hasn't been seen before in this session.
    // Prevents re-animating the same content when the user navigates away and back.
    const sessionKey = `brief-animated:${topicKey}`;
    const alreadyAnimated = sessionStorage.getItem(sessionKey) === data.generatedAt;
    if (alreadyAnimated) return;
    if (data.generatedAt) sessionStorage.setItem(sessionKey, data.generatedAt);

    if (data.headline) {
      // Stream witty headline first; bullets will start once it finishes
      setAnimWitty(data.headline);
      setAnimWittyPos(0);
      if (data.content) setPendingBullets(data.content);
    } else if (data.content) {
      // No witty headline — go straight to bullets
      startBulletAnimation(data.content);
    }
  }

  async function triggerGeneration(force = false) {
    setAnimWitty(null);   // cancel any in-progress animation
    setAnimBullets(null);
    setPendingBullets(null);
    try {
      const res = await fetch("/api/daily-brief/trigger", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topicKey, force }),
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === "ready") {
        applyFreshContent(data);
      } else if (data.status === "generating") {
        setIsRefreshing(true);
      }
    } catch {
      // network error — swallow
    }
  }

  // On mount: auto-check cache validity, start generation if stale
  useEffect(() => {
    const controller = new AbortController();

    async function mountTrigger() {
      try {
        const res = await fetch("/api/daily-brief/trigger", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ topicKey }),
          signal:  controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "ready") {
          applyFreshContent(data);
        } else if (data.status === "generating") {
          setIsRefreshing(true);
        }
      } catch {
        // AbortError on unmount — swallow silently
      }
    }

    mountTrigger();
    return () => { controller.abort(); };
  }, [topicKey]);

  // Poll status while a background job is running
  useEffect(() => {
    if (!isRefreshing) return;

    const controller = new AbortController();
    const interval   = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/daily-brief/status?topic=${encodeURIComponent(topicKey)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "idle") {
          setIsRefreshing(false);
          applyFreshContent(data);
        }
      } catch {
        // AbortError on unmount — swallow silently
      }
    }, 3000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [isRefreshing, topicKey]);

  if (error) {
    return <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>;
  }

  if (!content && !isRefreshing) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-4">
        <span className="animate-pulse">Generating brief…</span>
      </div>
    );
  }

  if (!content && isRefreshing) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-4">
        <UpdatingIndicator />
      </div>
    );
  }

  const formattedAt = generatedAt
    ? new Date(generatedAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit",
        timeZoneName: "short",
      })
    : null;

  return (
    <>
    <ArticlesDrawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      articles={articles}
    />
    <ExplainPopover
      contentRef={contentRef}
      context={[content, diff].filter(Boolean).join("\n\n")}
      label={label}
    />
    <div ref={contentRef} className="mt-2 space-y-6">
      {/* Audio Brief — shown as soon as content is available */}
      {!isAnimating && content && (
        <AudioBriefPlayer
          topicKey={topicKey}
          label={label}
          headline={headline}
          content={content}
          diff={diff}
          voiceGender={voiceGender}
          voiceTone={voiceTone}
        />
      )}

      {/* Metadata row */}
      <div className="flex flex-col gap-1 text-xs text-zinc-400 dark:text-zinc-500">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Current Developments</p>
        <div className="flex items-center gap-2">
          <span>
            Based on{" "}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {articleCount} article{articleCount !== 1 ? "s" : ""}
            </button>
            {" "}from the last 24 hours
          </span>
          {!isRefreshing && (
            <button
              onClick={() => { setIsRefreshing(true); triggerGeneration(true); }}
              className="ml-auto text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
              title="Force regenerate"
            >
              ↻
            </button>
          )}
        </div>
        {isRefreshing ? (
          <UpdatingIndicator />
        ) : formattedAt ? (
          <span className="text-zinc-300 dark:text-zinc-600">Generated on {formattedAt}</span>
        ) : null}
      </div>

      {/* Witty headline — streams first, then bullets begin */}
      {animWitty ? (
        <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
          {animWitty.slice(0, animWittyPos)}
          <span className="inline-block w-0.5 h-3.5 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5 align-text-bottom" />
        </p>
      ) : headline ? (
        <p className="text-sm italic text-zinc-500 dark:text-zinc-400">{headline}</p>
      ) : null}

      {/* Brief bullets */}
      {isAnimating ? (
        // Streaming view: completed bullets show their bold headline statically;
        // the active bullet streams its headline one character at a time.
        // Full CollapsibleBullet interactivity is restored after animation ends.
        <ul className="space-y-3">
          {(animBullets ?? []).map((_, i) => {
            if (i > animBulletIdx) return null;
            const isActive    = i === animBulletIdx;
            const visibleText = isActive
              ? animHeadlines[i].slice(0, animCharIdx)
              : animHeadlines[i];
            return (
              <li key={i} className="flex items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                <span className="flex-1 leading-relaxed font-semibold text-zinc-900 dark:text-white">
                  {visibleText}
                  {isActive && (
                    <span className="inline-block w-0.5 h-4 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        // Fully rendered view with collapsible bullets
        <ReactMarkdown
          components={{
            ul: ({ children }) => <ul className="space-y-3">{children}</ul>,
            li: ({ node, children }) =>
              node ? (
                <CollapsibleBullet node={node}>{children}</CollapsibleBullet>
              ) : (
                <li>{children}</li>
              ),
            p: ({ children }) => <span>{children}</span>,
          }}
        >
          {content ?? ""}
        </ReactMarkdown>
      )}

      {/* Diff — only show once animation is done */}
      {!isAnimating && diff && (
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300">
          <ReactMarkdown
            components={{
              p:      ({ children }) => <p className="leading-relaxed">{children}</p>,
              strong: ({ children }) => (
                <span className="font-semibold text-zinc-900 dark:text-white">{children}</span>
              ),
              ul: ({ children }) => <ul className="mt-2 space-y-1">{children}</ul>,
              li: ({ children }) => (
                <li className="flex gap-2 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                  <span>{children}</span>
                </li>
              ),
            }}
          >
            {diff}
          </ReactMarkdown>
        </div>
      )}

      {/* Developments Over Time — auto-loads once animation is done */}
      {!isAnimating && content && (
        <AnalyticalTakeSection
          topicKey={topicKey}
          label={label}
          content={content}
          generatedAt={generatedAt}
          historyCount={historyCount}
        />
      )}

      {/* Additional Info — loads on explicit scroll, one-shot per slide */}
      {!isAnimating && (
        <AdditionalInfoSection
          topicKey={topicKey}
          label={label}
          content={content}
        />
      )}
    </div>
    </>
  );
}
