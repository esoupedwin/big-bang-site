"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";

type HistoryEntry = {
  generated_at: string;
  headline:     string | null;
  content:      string | null;
  diff_summary: string | null;
};

type Props = {
  isOpen:   boolean;
  onClose:  () => void;
  topicKey: string;
};

export function BriefHistoryDrawer({ isOpen, onClose, topicKey }: Props) {
  const [entries,    setEntries]    = useState<HistoryEntry[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [expanded,   setExpanded]   = useState<number | null>(null);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/coverage/history?topic=${encodeURIComponent(topicKey)}`)
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isOpen, topicKey]);

  const drawer = (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 sm:w-96 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Past Developments</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Past generated briefs for this coverage</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-5 py-4 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
              <span className="animate-pulse">Loading history…</span>
            </div>
          )}

          {!loading && entries.length === 0 && (
            <p className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">No history recorded yet.</p>
          )}

          {!loading && entries.map((entry, i) => {
            const formattedAt = new Date(entry.generated_at).toLocaleString("en-GB", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
              timeZoneName: "short",
            });
            const isOpen = expanded === i;

            return (
              <div key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-3 px-5 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{formattedAt}</p>
                    {entry.headline && (
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5 leading-snug italic">
                        {entry.headline}
                      </p>
                    )}
                  </div>
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0 mt-1">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-zinc-700 dark:text-zinc-300 space-y-3">
                    {entry.content && (
                      <ReactMarkdown
                        components={{
                          ul: ({ children }) => <ul className="space-y-1.5">{children}</ul>,
                          li: ({ children }) => (
                            <li className="flex gap-2">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                              <span className="leading-relaxed">{children}</span>
                            </li>
                          ),
                          p:      ({ children }) => <p className="leading-relaxed">{children}</p>,
                          strong: ({ children }) => (
                            <span className="font-semibold text-zinc-900 dark:text-white">{children}</span>
                          ),
                        }}
                      >
                        {entry.content}
                      </ReactMarkdown>
                    )}

                    {entry.diff_summary && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1.5">
                          Changes since previous
                        </p>
                        <ReactMarkdown
                          components={{
                            ul: ({ children }) => <ul className="space-y-1">{children}</ul>,
                            li: ({ children }) => (
                              <li className="flex gap-2">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                                <span className="leading-relaxed">{children}</span>
                              </li>
                            ),
                            p:      ({ children }) => <p className="leading-relaxed">{children}</p>,
                            strong: ({ children }) => (
                              <span className="font-semibold text-zinc-900 dark:text-white">{children}</span>
                            ),
                          }}
                        >
                          {entry.diff_summary}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  if (!mounted) return null;
  return createPortal(drawer, document.body);
}
