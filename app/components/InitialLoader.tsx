"use client";

import { useEffect } from "react";

const STYLE = `
#bb-initial-loader {
  position: fixed; inset: 0; z-index: 9999;
  background: #09090b;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-family: ui-monospace, monospace;
}
#bb-initial-loader pre {
  color: #f4f4f5;
  font-size: clamp(5px, 1.2vw, 11px);
  line-height: 1.3;
  margin-bottom: 2.5rem;
  white-space: pre;
}
#bb-initial-loader .spinner {
  width: 28px; height: 28px;
  border: 2px solid #3f3f46;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: bb-spin 0.7s linear infinite;
  margin-bottom: 1rem;
}
#bb-initial-loader .tagline {
  color: #52525b;
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-top: 1rem;
}
@keyframes bb-spin { to { transform: rotate(360deg); } }
`;

const LOGO = `
  ██████╗ ██╗ ██████╗      ██████╗  █████╗ ███╗   ██╗ ██████╗
  ██╔══██╗██║██╔════╝      ██╔══██╗██╔══██╗████╗  ██║██╔════╝
  ██████╔╝██║██║  ███╗     ██████╔╝███████║██╔██╗ ██║██║  ███╗
  ██╔══██╗██║██║   ██║     ██╔══██╗██╔══██║██║╚██╗██║██║   ██║
  ██████╔╝██║╚██████╔╝     ██████╔╝██║  ██║██║ ╚████║╚██████╔╝
  ╚═════╝ ╚═╝ ╚═════╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝
`.trim();

export function InitialLoader() {
  useEffect(() => {
    document.getElementById("bb-initial-loader")?.remove();
    document.getElementById("bb-initial-loader-style")?.remove();
  }, []);

  return (
    <>
      <style
        id="bb-initial-loader-style"
        dangerouslySetInnerHTML={{ __html: STYLE }}
      />
      <div id="bb-initial-loader">
        <pre>{LOGO}</pre>
        <div className="spinner" />
        <div className="tagline">Geopolitical Intelligence</div>
      </div>
    </>
  );
}
