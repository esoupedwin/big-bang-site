"use client";

import { useEffect, useRef } from "react";

const CHARS = " .`-_':,;^=+/*!?|()[]{}rcszLTvJIfCtlu1neoZYxjya2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";

export function AsciiAnimation() {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    // Measure actual rendered character dimensions
    const probe = document.createElement("span");
    probe.textContent = "X";
    pre.appendChild(probe);
    const { width: CHAR_W, height: CHAR_H } = probe.getBoundingClientRect();
    pre.removeChild(probe);

    let animId: number;
    let start = performance.now();

    function frame(now: number) {
      const t = (now - start) / 1000;
      const cols = Math.floor(pre!.clientWidth / CHAR_W);
      const rows = Math.floor(pre!.clientHeight / CHAR_H);
      const cx = cols / 2;
      const cy = rows / 2;
      const aspect = CHAR_W / CHAR_H;

      const lines: string[] = [];

      for (let y = 0; y < rows; y++) {
        let line = "";
        for (let x = 0; x < cols; x++) {
          const dx = x - cx;
          const dy = (y - cy) / aspect;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let intensity = 0;

          // Four expanding waves, each launched 2s apart, looping every 8s
          const cycle = t % 8;
          for (let w = 0; w < 4; w++) {
            const wt = cycle - w * 2;
            if (wt > 0) {
              const radius = wt * 18;
              const diff = Math.abs(dist - radius);
              const spread = 1.5 + wt * 1.2;
              intensity += Math.exp(-(diff * diff) / (2 * spread * spread)) * Math.exp(-wt * 0.35);
            }
          }

          // Subtle background shimmer
          intensity +=
            (Math.sin(x * 0.4 + t * 0.9) * Math.cos(y * 0.4 - t * 0.6) + 1) * 0.025;

          const idx = Math.max(0, Math.min(CHARS.length - 1, Math.floor(intensity * CHARS.length * 0.7)));
          line += CHARS[idx];
        }
        lines.push(line);
      }

      if (pre) pre.textContent = lines.join("\n");
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <pre
      ref={preRef}
      style={{ fontSize: "10px", lineHeight: "16px" }}
      className="absolute inset-0 font-mono text-zinc-400 dark:text-zinc-600 overflow-hidden pointer-events-none select-none whitespace-pre"
      aria-hidden="true"
    />
  );
}
