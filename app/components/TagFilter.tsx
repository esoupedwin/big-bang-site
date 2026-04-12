"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  geoTags: string[];
  topicTags: string[];
};

const activeClass =
  "bg-zinc-800 text-white border-zinc-800 dark:bg-white dark:text-zinc-900 dark:border-white";
const inactiveClass =
  "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500";
const pillBase = "text-xs font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer";

export function TagFilter({ geoTags, topicTags }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedGeo = searchParams.getAll("geo");
  const selectedTopic = searchParams.getAll("topic");

  function toggle(param: "geo" | "topic", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(param);
    params.delete(param);
    if (current.includes(value)) {
      current.filter((v) => v !== value).forEach((v) => params.append(param, v));
    } else {
      [...current, value].forEach((v) => params.append(param, v));
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
          Geography
        </p>
        <div className="flex flex-wrap gap-2">
          {geoTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggle("geo", tag)}
              className={`${pillBase} ${selectedGeo.includes(tag) ? activeClass : inactiveClass}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
          Topics
        </p>
        <div className="flex flex-wrap gap-2">
          {topicTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggle("topic", tag)}
              className={`${pillBase} ${selectedTopic.includes(tag) ? activeClass : inactiveClass}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
