"use client";

import { useEffect, useState } from "react";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Singapore",
    timeZoneName: "short",
  });

type Props = {
  isOpen:  boolean;
  onClose: () => void;
};

export function AdminDrawer({ isOpen, onClose }: Props) {
  const [latestFetch,      setLatestFetch]      = useState<string | null>(null);
  const [latestFetchCount, setLatestFetchCount] = useState<number | null>(null);
  const [totalCount,       setTotalCount]       = useState<number | null>(null);
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/admin/latest-fetch")
      .then((r) => r.json())
      .then((data) => {
        setLatestFetch(data.latestFetch ?? null);
        setLatestFetchCount(data.latestFetchCount ?? null);
        setTotalCount(data.totalCount ?? null);
      })
      .catch(() => {
        setLatestFetch(null);
        setLatestFetchCount(null);
        setTotalCount(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Admin Panel</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 animate-pulse">Loading…</p>
          ) : (
            <>
              {/* Latest fetch */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">
                  Latest Fetch
                </p>
                {latestFetch ? (
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{fmt(latestFetch)}</p>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">No data</p>
                )}
              </div>

              {/* Entries in latest fetch */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">
                  Entries in Latest Fetch
                </p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">
                  {latestFetchCount !== null ? latestFetchCount.toLocaleString() : "—"}
                </p>
              </div>

              {/* Total feed entries */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">
                  Total Feed Entries
                </p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">
                  {totalCount !== null ? totalCount.toLocaleString() : "—"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
