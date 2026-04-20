"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  className?: string;
  highlight?: string;
};

function highlightText(text: string, query: string) {
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
    ) : (
      part
    )
  );
}

export function CollapsibleText({ text, className = "", highlight }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setOverflows(el.scrollHeight > el.clientHeight);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`${className} ${!expanded ? "line-clamp-4" : ""}`}
      >
        {highlight ? highlightText(text, highlight) : text}
      </p>
      {(overflows || expanded) && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
