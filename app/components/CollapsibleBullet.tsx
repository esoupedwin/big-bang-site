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
    <li className="flex gap-3 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
      <span className="flex-1">
        {headline ? (
          expanded ? (
            <span>{children}</span>
          ) : (
            <span className="font-semibold text-zinc-900 dark:text-white">{headline}</span>
          )
        ) : (
          <span>{children}</span>
        )}
        {headline && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="ml-2 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </span>
    </li>
  );
}
