"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";

type Props = {
  topicKey: string;
  label:    string;
  content:  string | null;
};

const TEXT_KEY     = (k: string) => `additional-info:${k}`;
const IMAGES_KEY   = (k: string) => `additional-info-images:${k}`;
const CONCEPTS_KEY = (k: string) => `additional-info-concepts:${k}`;

/** Returns true when the current page load is a hard refresh (Ctrl+F5 / Cmd+Shift+R). */
function isHardRefresh(): boolean {
  if (typeof window === "undefined") return false;
  const entries = performance.getEntriesByType("navigation");
  if (!entries.length) return false;
  return (entries[0] as PerformanceNavigationTiming).type === "reload";
}

function readSession(key: string): string {
  if (isHardRefresh()) return "";
  return sessionStorage.getItem(key) ?? "";
}

function readSessionImages(topicKey: string): Record<string, string> {
  if (isHardRefresh()) return {};
  try {
    const raw = sessionStorage.getItem(IMAGES_KEY(topicKey));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Pull plain text out of ReactMarkdown children (handles strings + nested elements). */
function childrenToText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return childrenToText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return "";
}

/** Generic streaming fetch helper — streams into a state setter and saves to sessionStorage when done. */
async function streamInto(
  url: string,
  body: object,
  onChunk: (accumulated: string) => void,
  onDone: (final: string) => void,
  onError: () => void,
  signal: { cancelled: boolean }
) {
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok || !res.body) { onError(); return; }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done || signal.cancelled) break;
      accumulated += decoder.decode(value, { stream: true });
      onChunk(accumulated);
    }
    if (!signal.cancelled) onDone(accumulated);
  } catch {
    if (!signal.cancelled) onError();
  }
}

export function AdditionalInfoSection({ topicKey, label, content }: Props) {
  const sentinelRef        = useRef<HTMLDivElement>(null);
  const conceptSentinelRef = useRef<HTMLDivElement>(null);

  // ── Personalities ──────────────────────────────────────────────────────────
  const [triggered,      setTriggered]      = useState(() => {
    if (typeof window === "undefined") return false;
    return !isHardRefresh() && !!sessionStorage.getItem(TEXT_KEY(topicKey));
  });
  const [personText,     setPersonText]     = useState(() =>
    typeof window !== "undefined" ? readSession(TEXT_KEY(topicKey)) : ""
  );
  const [personLoading,  setPersonLoading]  = useState(false);
  const [personError,    setPersonError]    = useState("");
  const [wikiImages,     setWikiImages]     = useState<Record<string, string>>(() =>
    typeof window !== "undefined" ? readSessionImages(topicKey) : {}
  );

  // ── Concepts ───────────────────────────────────────────────────────────────
  const [conceptTriggered, setConceptTriggered] = useState(() => {
    if (typeof window === "undefined") return false;
    return !isHardRefresh() && !!sessionStorage.getItem(CONCEPTS_KEY(topicKey));
  });
  const [conceptText,    setConceptText]    = useState(() =>
    typeof window !== "undefined" ? readSession(CONCEPTS_KEY(topicKey)) : ""
  );
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptError,   setConceptError]   = useState("");

  // ── Lightbox ───────────────────────────────────────────────────────────────
  const [lightboxImg, setLightboxImg] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (!lightboxImg) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxImg(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxImg]);

  // ── Hard-refresh: purge all cached entries ─────────────────────────────────
  useEffect(() => {
    if (isHardRefresh()) {
      sessionStorage.removeItem(TEXT_KEY(topicKey));
      sessionStorage.removeItem(IMAGES_KEY(topicKey));
      sessionStorage.removeItem(CONCEPTS_KEY(topicKey));
    }
  }, [topicKey]);

  // ── IntersectionObserver: fire both fetches when sentinel enters view ───────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || triggered || !content) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          setTriggered(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggered, content]);

  // ── Fetch personalities ────────────────────────────────────────────────────
  useEffect(() => {
    if (!triggered || !content) return;
    if (sessionStorage.getItem(TEXT_KEY(topicKey))) return;

    const signal = { cancelled: false };
    setPersonLoading(true);
    setPersonText("");
    setPersonError("");

    streamInto(
      "/api/coverage/additional-info",
      { label, content },
      (acc) => setPersonText(acc),
      (final) => {
        if (final) sessionStorage.setItem(TEXT_KEY(topicKey), final);
        setPersonLoading(false);
      },
      () => { setPersonError("Failed to load personality profiles."); setPersonLoading(false); },
      signal
    );

    return () => { signal.cancelled = true; };
  }, [triggered, label, content, topicKey]);

  // ── Concepts sentinel: arm only after personalities have fully loaded ────────
  useEffect(() => {
    const el = conceptSentinelRef.current;
    // Only start observing once personalities are done and concepts not yet triggered
    if (!el || conceptTriggered || personLoading || !personText) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          setConceptTriggered(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [conceptTriggered, personLoading, personText]);

  // ── Fetch concepts once scroll-triggered ──────────────────────────────────
  useEffect(() => {
    if (!conceptTriggered || !content) return;
    if (sessionStorage.getItem(CONCEPTS_KEY(topicKey))) return;

    const signal = { cancelled: false };
    setConceptLoading(true);
    setConceptText("");
    setConceptError("");

    streamInto(
      "/api/coverage/concepts",
      { label, content },
      (acc) => setConceptText(acc),
      (final) => {
        if (final) sessionStorage.setItem(CONCEPTS_KEY(topicKey), final);
        setConceptLoading(false);
      },
      () => { setConceptError("Failed to load concepts."); setConceptLoading(false); },
      signal
    );

    return () => { signal.cancelled = true; };
  }, [conceptTriggered, label, content, topicKey]);

  // ── Wikipedia profile pics (after personalities stream finishes) ────────────
  useEffect(() => {
    if (personLoading || !personText) return;
    if (sessionStorage.getItem(IMAGES_KEY(topicKey))) return;

    const names = [...personText.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    if (names.length === 0) return;

    Promise.all(
      names.map(async (name) => {
        try {
          const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
            { headers: { Accept: "application/json" } }
          );
          if (!res.ok) return [name, null] as const;
          const data = await res.json() as { thumbnail?: { source: string } };
          return [name, data.thumbnail?.source ?? null] as const;
        } catch {
          return [name, null] as const;
        }
      })
    ).then((results) => {
      const images: Record<string, string> = {};
      for (const [name, url] of results) { if (url) images[name] = url; }
      setWikiImages(images);
      sessionStorage.setItem(IMAGES_KEY(topicKey), JSON.stringify(images));
    });
  }, [personLoading, personText, topicKey]);

  if (!content) return null;

  const personDone   = !personLoading  && (!!personText  || !!personError);
  const conceptsDone = !conceptLoading && (!!conceptText || !!conceptError);

  return (
    <>
      {/* Lightbox — portalled to body so `fixed` is relative to the true viewport */}
      {lightboxImg && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-xs w-full mx-6 flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImg.url}
              alt={lightboxImg.name}
              className="w-56 h-56 rounded-2xl object-cover shadow-2xl"
            />
            <p className="text-sm font-semibold text-white">{lightboxImg.name}</p>
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-sm leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Spacer — requires intentional scroll to reach this section */}
      <div className="h-40" />

      {/* ── Section wrapper ───────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-8">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Additional Info
        </h3>

        {/* Sentinel: IntersectionObserver watches this element */}
        <div ref={sentinelRef} />

        {!triggered && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
            Scroll to load additional information…
          </p>
        )}

        {/* ── Personalities segment ──────────────────────────────────────── */}
        {triggered && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
              Personalities mentioned:
            </p>

            {personLoading && !personText && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
                <span className="animate-pulse">Searching for personalities…</span>
              </div>
            )}

            {(personText || personDone) && (
              <div className="space-y-1">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => {
                      const name   = childrenToText(children);
                      const imgUrl = wikiImages[name];
                      return (
                        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3 mt-6 first:mt-0">
                          {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgUrl}
                              alt={name}
                              onClick={() => setLightboxImg({ url: imgUrl, name })}
                              className="w-10 h-10 rounded-full object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800 cursor-pointer hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-shadow"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-xs font-semibold select-none">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {children}
                          </h2>
                        </div>
                      );
                    },
                    p: ({ children }) => (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <span className="font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide mr-1">
                        {children}
                      </span>
                    ),
                  }}
                >
                  {personText}
                </ReactMarkdown>
                {personLoading && (
                  <span className="inline-block w-0.5 h-3.5 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            )}

            {personError && (
              <p className="text-xs text-red-500 dark:text-red-400">{personError}</p>
            )}

            {personDone && !personError && (
              <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-3">
                Profile pictures sourced from Wikipedia.
              </p>
            )}
          </div>
        )}

        {/* ── Concepts segment — rendered once personalities are done ───── */}
        {triggered && !personLoading && personText && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
              Concepts explained:
            </p>

            {/* Sentinel: concepts fetch only fires when this scrolls into view */}
            <div ref={conceptSentinelRef} />

            {!conceptTriggered && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                Scroll to load concept explanations…
              </p>
            )}

            {conceptTriggered && conceptLoading && !conceptText && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
                <span className="animate-pulse">Looking up concepts…</span>
              </div>
            )}

            {(conceptText || (conceptTriggered && !conceptLoading)) && (
              <div className="space-y-4">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mt-4 mb-1 first:mt-0">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {children}
                      </p>
                    ),
                  }}
                >
                  {conceptText}
                </ReactMarkdown>
                {conceptLoading && (
                  <span className="inline-block w-0.5 h-3.5 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            )}

            {conceptError && (
              <p className="text-xs text-red-500 dark:text-red-400">{conceptError}</p>
            )}
          </div>
        )}

      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </>
  );
}
