"use client";

import { useEffect, useState } from "react";
import type { Achievement } from "@/lib/achievements";

/**
 * Holds an earned achievement and only surfaces it once the tab is visible,
 * so the toast isn't shown and auto-dismissed while the user is in another tab.
 */
export function useTabFocusAchievement() {
  const [pending,        setPending]        = useState<Achievement | null>(null);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    if (!pending) return;

    if (document.visibilityState === "visible") {
      setNewAchievement(pending);
      setPending(null);
      return;
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setNewAchievement(pending);
        setPending(null);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pending]);

  return { newAchievement, setNewAchievement, onEarned: setPending };
}
