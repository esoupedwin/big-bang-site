"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CollapsibleBullet } from "./CollapsibleBullet";

function UpdatingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
      Updating
      <span className="inline-flex gap-0.5 items-center">
        <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-500 animate-bounce" />
      </span>
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
  cachedContent:  string | null;
  cachedHeadline: string | null;
  cachedDiff:     string | null;
  cachedAt:       string | null;
  articleCount:   number;
};

export function DailyBriefPanel({
  topicKey,
  cachedContent,
  cachedHeadline,
  cachedDiff,
  cachedAt,
  articleCount,
}: Props) {
  const [content,      setContent]      = useState(cachedContent);
  const [headline,     setHeadline]     = useState(cachedHeadline);
  const [diff,         setDiff]         = useState(cachedDiff);
  const [generatedAt,  setGeneratedAt]  = useState(cachedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState("");

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

  const isAnimating = animWitty !== null || animBullets !== null;

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
    if (data.content) {
      setContent(data.content);
    }
    if (data.headline) {
      setHeadline(data.headline);
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
    <div className="mt-2 space-y-6">
      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        <span>
          Based on {articleCount} article{articleCount !== 1 ? "s" : ""} from the last 24 hours
        </span>
        {isRefreshing ? (
          <>
            <span>·</span>
            <UpdatingIndicator />
          </>
        ) : formattedAt ? (
          <span className="text-zinc-300 dark:text-zinc-600">· cached {formattedAt}</span>
        ) : null}
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
    </div>
  );
}
