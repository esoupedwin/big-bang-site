"use client";

import { useState } from "react";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Singapore",
    timeZoneName: "short",
  });

export function FetchedAtPopover({ fetchedAt }: { fetchedAt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors leading-none"
        aria-label="Show fetch date"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-6-3.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 7.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v2.25h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25V8.25H7.75A.75.75 0 0 1 7 7.5Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 whitespace-nowrap rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-1.5 shadow-lg text-xs text-zinc-600 dark:text-zinc-300">
          <span className="text-zinc-400 dark:text-zinc-500">Fetched</span>
          {fmt(fetchedAt)}
          <button
            onClick={() => setOpen(false)}
            className="ml-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </span>
      )}
    </span>
  );
}
