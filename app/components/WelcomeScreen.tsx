"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "bb_session_welcomed";

const LOGO = `
  ████████╗██╗  ██╗██╗██████╗ ██████╗      ███████╗██╗   ██╗███████╗
  ╚══██╔══╝██║  ██║██║██╔══██╗██╔══██╗     ██╔════╝╚██╗ ██╔╝██╔════╝
     ██║   ███████║██║██████╔╝██║  ██║     █████╗   ╚████╔╝ █████╗
     ██║   ██╔══██║██║██╔══██╗██║  ██║     ██╔══╝    ╚██╔╝  ██╔══╝
     ██║   ██║  ██║██║██║  ██║██████╔╝     ███████╗   ██║   ███████╗
     ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝      ╚══════╝   ╚═╝   ╚══════╝
`.trim();

export function WelcomeScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 font-mono select-none px-6">
      <pre className="text-zinc-100 text-[7px] sm:text-[9px] md:text-[11px] leading-tight mb-12 overflow-hidden">
        {LOGO}
      </pre>

      <p className="text-zinc-300 text-base font-sans font-medium mb-2">
        Welcome back.
      </p>
      <p className="text-zinc-500 text-sm font-sans mb-12">
        Preparing your brief…
      </p>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <p className="absolute bottom-8 text-[10px] tracking-[0.3em] uppercase text-zinc-700">
        Global Affairs Tracking
      </p>
    </div>
  );
}
