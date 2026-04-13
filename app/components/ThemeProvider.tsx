"use client";

import { useEffect } from "react";
import type { Theme } from "@/lib/preferences";

export function ThemeProvider({ theme }: { theme: Theme }) {
  useEffect(() => {
    const root = document.documentElement;

    function apply(isDark: boolean) {
      root.classList.toggle("dark", isDark);
    }

    if (theme === "dark") {
      apply(true);
    } else if (theme === "light") {
      apply(false);
    } else {
      // system — follow OS preference
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return null;
}
