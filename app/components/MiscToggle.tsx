"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function MiscToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showMisc = searchParams.get("show_misc") === "1";

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (showMisc) {
      params.delete("show_misc");
    } else {
      params.set("show_misc", "1");
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Show miscellaneous-only articles
      </span>
      <button
        role="switch"
        aria-checked={showMisc}
        onClick={toggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          showMisc
            ? "bg-zinc-800 dark:bg-white"
            : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white dark:bg-zinc-900 transition-transform ${
            showMisc ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
