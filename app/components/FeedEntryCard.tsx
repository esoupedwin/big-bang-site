"use client";

import { useState } from "react";
import { FeedEntry } from "@/lib/feed";
import { CollapsibleText } from "./CollapsibleText";
import { FetchedAtPopover } from "./FetchedAtPopover";
import { trackArticleClickAction } from "@/app/actions/achievements";
import type { Achievement } from "@/lib/achievements";
import { AchievementToast } from "./AchievementToast";

export function FeedEntryCard({ entry }: { entry: FeedEntry }) {
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  return (
    <li className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onDismiss={() => setNewAchievement(null)}
        />
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {entry.feed_name}
        </span>
        {entry.published_at && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            <span className="text-zinc-300 dark:text-zinc-600">Published </span>
            {new Date(entry.published_at).toLocaleString("en-GB", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
              timeZone: "Asia/Singapore",
              timeZoneName: "short",
            })}
          </span>
        )}
        {entry.fetched_at && <FetchedAtPopover fetchedAt={entry.fetched_at} />}
      </div>

      <a
        href={entry.link ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline"
        onClick={() => {
          trackArticleClickAction().then((earned) => {
            if (earned) setNewAchievement(earned);
          });
        }}
      >
        {entry.title}
      </a>

      {entry.author && (
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{entry.author}</p>
      )}

      {(entry.summary || entry.gist) && (
        <div className="mt-1 space-y-1">
          {entry.summary && (
            <CollapsibleText
              text={entry.summary}
              className="text-sm text-zinc-600 dark:text-zinc-400"
            />
          )}
          {entry.gist && (
            <CollapsibleText
              text={entry.gist}
              className="text-sm text-zinc-500 dark:text-zinc-500"
            />
          )}
        </div>
      )}

      {(entry.geo_tags?.length || entry.topic_tags?.length) ? (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.geo_tags?.map((tag) => (
            <span key={`geo:${tag}`} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {entry.topic_tags?.map((tag) => (
            <span key={`topic:${tag}`} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}
