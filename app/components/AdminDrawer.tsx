"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [resetting,        setResetting]        = useState(false);
  const [resetDone,        setResetDone]        = useState(false);
  const [onboardingReset,  setOnboardingReset]  = useState(false);
  const router = useRouter();

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
          {/* Reset achievements */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
              Achievements
            </p>
            <button
              onClick={async () => {
                setResetting(true);
                setResetDone(false);
                await fetch("/api/admin/reset-achievements", { method: "DELETE" });
                setResetting(false);
                setResetDone(true);
              }}
              disabled={resetting}
              className="px-3 py-1.5 text-xs font-medium rounded border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {resetting ? "Resetting…" : "Reset My Achievements"}
            </button>
            {resetDone && (
              <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">All achievements cleared.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
              Tooltips
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("te:coachmark_step");
                window.dispatchEvent(new CustomEvent("te:reset"));
                onClose();
                router.push("/daily-brief");
              }}
              className="px-3 py-1.5 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Replay Tooltips
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
              Onboarding
            </p>
            <button
              onClick={async () => {
                setOnboardingReset(true);
                await fetch("/api/admin/reset-onboarding", { method: "DELETE" });
                setOnboardingReset(false);
                onClose();
                router.push("/onboarding");
              }}
              disabled={onboardingReset}
              className="px-3 py-1.5 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {onboardingReset ? "Redirecting…" : "View Onboarding"}
            </button>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />
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
