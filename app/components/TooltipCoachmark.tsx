"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Placement = "below" | "swipe";

type Props = {
  anchorSelector: string;
  text: string;
  placement?: Placement;
  onDismiss: () => void;
};

type AnchorRect = {
  bottom: number;
  centerX: number;
  top: number;
  height: number;
};

export function TooltipCoachmark({ anchorSelector, text, placement = "below", onDismiss }: Props) {
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = document.querySelector(anchorSelector) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchorRect({
      bottom: r.bottom,
      centerX: r.left + r.width / 2,
      top: r.top,
      height: r.height,
    });
  }, [anchorSelector]);

  // Stream text character by character when anchor is ready
  useEffect(() => {
    if (!anchorRect) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const tick = () => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        frameRef.current = setTimeout(tick, 18);
      } else {
        setDone(true);
      }
    };
    frameRef.current = setTimeout(tick, 18);
    return () => { if (frameRef.current) clearTimeout(frameRef.current); };
  // text won't change mid-display; anchorRect is the mount signal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorRect]);

  if (!anchorRect) return null;

  const isSwipe = placement === "swipe";

  const tooltipTop = isSwipe
    ? anchorRect.top + anchorRect.height * 0.38
    : anchorRect.bottom + 8;

  const tooltipLeft = isSwipe ? anchorRect.centerX * 1.35 : anchorRect.centerX;
  const tooltipTransform = isSwipe ? "translate(-100%, -50%)" : "translateX(-50%)";

  // Nib — matches the panel bg exactly so it reads as one shape
  const nib = (
    <div className="w-3 h-3 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rotate-45" />
  );

  const bubble = (
    <>
      <div className="fixed inset-0 z-[199] bg-black/30" onClick={onDismiss} />
      <div
        className="fixed z-[200] w-[210px] pointer-events-auto"
        style={{ top: tooltipTop, left: tooltipLeft, transform: tooltipTransform }}
      >
        {/* Top nib for "below" placement */}
        {!isSwipe && (
          <div className="flex justify-center -mb-[7px]">
            <div className="w-3 h-3 bg-white dark:bg-zinc-800 border-l border-t border-zinc-200 dark:border-zinc-700 rotate-45" />
          </div>
        )}

        <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl px-4 py-3 text-center">
          {/* Right nib for "swipe" placement */}
          {isSwipe && (
            <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-r border-t border-zinc-200 dark:border-zinc-700 rotate-45" />
          )}

          <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-200 mb-3 min-h-[3rem]">
            {displayed}
            {!done && <span className="inline-block w-px h-3 ml-0.5 bg-zinc-400 dark:bg-zinc-500 animate-pulse align-middle" />}
          </p>
          <button
            onClick={onDismiss}
            disabled={!done}
            className="text-[11px] font-medium px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-300 disabled:opacity-0"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(bubble, document.body) : null;
}
