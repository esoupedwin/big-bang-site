"use client";

import { useEffect, useState } from "react";

const SPINNER_FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

const MESSAGES = [
  "Authenticating session",
  "Loading intelligence feeds",
  "Scanning geopolitical data",
  "Preparing analysis",
  "Establishing secure connection",
];

const ASCII_LOGO = `
  ████████╗██╗  ██╗██╗██████╗ ██████╗      ███████╗██╗   ██╗███████╗
  ╚══██╔══╝██║  ██║██║██╔══██╗██╔══██╗     ██╔════╝╚██╗ ██╔╝██╔════╝
     ██║   ███████║██║██████╔╝██║  ██║     █████╗   ╚████╔╝ █████╗
     ██║   ██╔══██║██║██╔══██╗██║  ██║     ██╔══╝    ╚██╔╝  ██╔══╝
     ██║   ██║  ██║██║██║  ██║██████╔╝     ███████╗   ██║   ███████╗
     ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝      ╚══════╝   ╚═╝   ╚══════╝
`.trim();

const GLOBE_FRAMES = [
  [
    "      .·:''''':·.      ",
    "    ·' ─── ( ─── '·    ",
    "   /  ──── ) ────  \\   ",
    "  | ─────( )───── |  ",
    "   \\  ──── ) ────  /   ",
    "    '·  ─── ( ── ·'    ",
    "      '·:.....:·'      ",
  ],
  [
    "      .·:''''':·.      ",
    "    ·' ──── ) ─── '·    ",
    "   /  ───── ( ────  \\   ",
    "  | ──────) (────── |  ",
    "   \\  ───── ( ────  /   ",
    "    '·  ──── ) ── ·'    ",
    "      '·:.....:·'      ",
  ],
  [
    "      .·:''''':·.      ",
    "    ·' ──── ( ─── '·    ",
    "   /  ────── ) ───  \\   ",
    "  | ─────── ( ───── |  ",
    "   \\  ────── ) ───  /   ",
    "    '·  ──── ( ── ·'    ",
    "      '·:.....:·'      ",
  ],
  [
    "      .·:''''':·.      ",
    "    ·' ─── ) ──── '·    ",
    "   /  ─── ( ─────  \\   ",
    "  | ────) ( ─────── |  ",
    "   \\  ─── ( ─────  /   ",
    "    '·  ── ) ───── ·'    ",
    "      '·:.....:·'      ",
  ],
];

export function AppLoading() {
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [globeFrame,   setGlobeFrame]   = useState(0);
  const [msgIdx,       setMsgIdx]       = useState(0);
  const [dots,         setDots]         = useState("");

  useEffect(() => {
    const t = setInterval(() => setSpinnerFrame(f => (f + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setGlobeFrame(f => (f + 1) % GLOBE_FRAMES.length), 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 font-mono select-none">

      {/* ASCII Logo */}
      <pre className="text-zinc-100 text-[7px] sm:text-[9px] md:text-[11px] leading-tight mb-10 overflow-hidden">
        {ASCII_LOGO}
      </pre>

      {/* Globe */}
      <pre className="text-zinc-400 text-xs leading-relaxed mb-10 hidden sm:block">
        {GLOBE_FRAMES[globeFrame].join("\n")}
      </pre>

      {/* Spinner + message */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="text-amber-500">{SPINNER_FRAMES[spinnerFrame]}</span>
        <span>{MESSAGES[msgIdx]}<span className="inline-block w-5 text-left text-amber-500">{dots}</span></span>
      </div>

      {/* Tagline */}
      <p className="mt-8 text-[10px] tracking-[0.3em] uppercase text-zinc-600">
        There’s a lot happening. Most of it doesn’t matter. Third Eye shows you what does.
      </p>
    </div>
  );
}
