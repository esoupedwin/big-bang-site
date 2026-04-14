import { getAllTags } from "@/lib/feed";
import { TagFilter } from "./TagFilter";

// Async server component — resolves getAllTags() independently of the feed
// entries query so the page can render articles before tags are ready.
export async function TagFilterAsync() {
  const { geoTags, topicTags } = await getAllTags();
  return <TagFilter geoTags={geoTags} topicTags={topicTags} />;
}

// Skeleton shown while TagFilterAsync is loading.
// Pill sizes are approximate averages of the real tag labels.
export function TagFilterSkeleton() {
  const geoPills  = [72, 56, 60, 80, 48, 64, 52, 68, 44, 56, 72, 60, 48, 56, 64, 52, 72, 48, 56];
  const topicPills = [112, 96, 64, 104, 72, 80, 56, 64, 80, 48, 96];

  return (
    <div className="space-y-3 animate-pulse">
      <div>
        <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          {geoPills.map((w, i) => (
            <div key={i} className="h-6 rounded-full bg-zinc-100 dark:bg-zinc-800" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div>
        <div className="h-2.5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          {topicPills.map((w, i) => (
            <div key={i} className="h-6 rounded-full bg-zinc-100 dark:bg-zinc-800" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}
