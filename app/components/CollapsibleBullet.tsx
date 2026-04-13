"use client";

import { useState } from "react";

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
};

function extractText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(extractText).join("");
}

function findHeadline(node: HastNode): string | null {
  if (node.tagName === "strong") return extractText(node);
  for (const child of node.children ?? []) {
    const result = findHeadline(child);
    if (result) return result;
  }
  return null;
}

type Props = {
  node: HastNode;
  children: React.ReactNode;
};

export function CollapsibleBullet({ node, children }: Props) {
  const [expanded, setExpanded] = useState(false);
  const headline = findHeadline(node);

  return (
    <li className="flex items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
      <span className="flex-1 flex items-center gap-2">
        {headline ? (
          expanded ? (
            <span className="leading-relaxed">{children}</span>
          ) : (
            <span className="font-semibold text-zinc-900 dark:text-white leading-relaxed">{headline}</span>
          )
        ) : (
          <span className="leading-relaxed">{children}</span>
        )}
        {headline && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-2xl text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors leading-none shrink-0"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </span>
    </li>
  );
}
