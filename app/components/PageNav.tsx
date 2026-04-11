import Link from "next/link";

type PageNavProps = {
  page: number;
  totalPages: number;
  selectedTags: string[];
};

const linkClass =
  "px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700";

function pageHref(page: number, selectedTags: string[]): string {
  const params = new URLSearchParams();
  selectedTags.forEach((t) => params.append("tags", t));
  params.set("page", String(page));
  return `/?${params.toString()}`;
}

export function PageNav({ page, totalPages, selectedTags }: PageNavProps) {
  return (
    <div className="flex items-center justify-between">
      {page > 1 ? (
        <Link href={pageHref(page - 1, selectedTags)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={pageHref(page + 1, selectedTags)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
