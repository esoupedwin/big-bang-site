"use client";

import { useEffect, useRef } from "react";

const CHARS = " .`-_':,;^=+/*!?|()[]{}rcszLTvJIfCtlu1neoZYxjya2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";

export function AsciiAnimation() {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    // Measure actual rendered character advance width using multiple chars
    const probe = document.createElement("span");
    probe.textContent = "X".repeat(20);
    pre.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    const CHAR_W = rect.width / 20;
    const CHAR_H = rect.height;
    pre.removeChild(probe);

    let animId: number;
    let start = performance.now();

    function frame(now: number) {
      const t = (now - start) / 1000;
      const cols = Math.ceil(pre!.clientWidth / CHAR_W) + 1;
      const rows = Math.ceil(pre!.clientHeight / CHAR_H) + 1;
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

          // Four waves with independent staggered phases — no shared reset
          for (let w = 0; w < 4; w++) {
            const wt = (t + w * 2) % 8;
            const radius = wt * 18;
            const diff = Math.abs(dist - radius);
            const spread = 1.5 + wt * 1.2;
            intensity += Math.exp(-(diff * diff) / (2 * spread * spread)) * Math.exp(-wt * 0.35);
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
      className="absolute inset-0 m-0 p-0 font-mono text-zinc-400 dark:text-zinc-600 overflow-hidden pointer-events-none select-none whitespace-pre"
      aria-hidden="true"
    />
  );
}
