"use client";

import { FeedEntry } from "@/lib/feed";
import { CollapsibleText } from "./CollapsibleText";
import { FetchedAtPopover } from "./FetchedAtPopover";
import { trackArticleClickAction } from "@/app/actions/achievements";
import { AchievementToast } from "./AchievementToast";
import { useTabFocusAchievement } from "@/app/hooks/useTabFocusAchievement";

function highlightTitle(text: string, query: string) {
  // Flatten all AND/OR groups into unique terms; skip the literal "OR" operator.
  const terms = [...new Set(
    query.split(" OR ").flatMap((g) => g.trim().split(/\s+/)).filter(Boolean)
  )];
  if (terms.length === 0) return text;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-inherit rounded-sm px-0.5">
        {part}
      </mark>
    ) : part
  );
}

export function FeedEntryCard({ entry, highlight }: { entry: FeedEntry; highlight?: string }) {
  const { newAchievement, setNewAchievement, onEarned } = useTabFocusAchievement();

  return (
    <li className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onDismiss={() => setNewAchievement(null)}
        />
      )}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {entry.feed_name}
        </span>
        {entry.published_at && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 w-full sm:w-auto">
            <span className="text-zinc-300 dark:text-zinc-600">Published </span>
            {new Date(entry.published_at).toLocaleString("en-GB", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
              timeZone: "Asia/Singapore",
              timeZoneName: "short",
            })}
            {entry.fetched_at && <FetchedAtPopover fetchedAt={entry.fetched_at} />}
          </span>
        )}
      </div>

      <a
        href={entry.link ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-semibold text-zinc-900 dark:text-white hover:underline"
        onClick={() => {
          trackArticleClickAction().then((earned) => {
            if (earned) onEarned(earned);
          }).catch(() => {});
        }}
      >
        {highlight ? highlightTitle(entry.title ?? "", highlight) : entry.title}
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
              highlight={highlight}
            />
          )}
          {entry.gist && (
            <CollapsibleText
              text={entry.gist}
              className="text-sm text-zinc-500 dark:text-zinc-500"
              highlight={highlight}
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
