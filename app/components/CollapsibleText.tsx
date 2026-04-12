"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  className?: string;
};

export function CollapsibleText({ text, className = "" }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setOverflows(el.scrollHeight > el.clientHeight);
    }
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`${className} ${!expanded ? "line-clamp-4" : ""}`}
      >
        {text}
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
