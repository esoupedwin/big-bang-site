"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function TagFilter({ allTags }: { allTags: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTags = searchParams.getAll("tags");

  function toggleTag(tag: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedTags.includes(tag)) {
      const remaining = selectedTags.filter((t) => t !== tag);
      params.delete("tags");
      remaining.forEach((t) => params.append("tags", t));
    } else {
      params.append("tags", tag);
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer ${
              active
                ? "bg-zinc-800 text-white border-zinc-800 dark:bg-white dark:text-zinc-900 dark:border-white"
                : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
