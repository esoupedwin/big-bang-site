"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Achievement } from "@/lib/achievements";

type Props = {
  achievement: Achievement;
  onDismiss:   () => void;
};

const AUTO_DISMISS_MS = 5000;

export function AchievementToast({ achievement, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    const show  = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS - 400);
    return () => { cancelAnimationFrame(show); clearTimeout(timer); };
  }, []);

  // Wait for exit animation before calling onDismiss
  useEffect(() => {
    if (visible) return;
    const timer = setTimeout(onDismiss, 400);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  return createPortal(
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-400 ease-out ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-900 min-w-72 max-w-sm">
        {/* Badge icon */}
        <div className="shrink-0 w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-2xl select-none">
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-0.5">
            Achievement Unlocked!
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">
            {achievement.title}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
            {achievement.description}
          </p>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
}
