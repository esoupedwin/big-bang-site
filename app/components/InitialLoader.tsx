"use client";

import { useEffect, useState } from "react";

const LOGO = `
  ██████╗ ██╗ ██████╗      ██████╗  █████╗ ███╗   ██╗ ██████╗
  ██╔══██╗██║██╔════╝      ██╔══██╗██╔══██╗████╗  ██║██╔════╝
  ██████╔╝██║██║  ███╗     ██████╔╝███████║██╔██╗ ██║██║  ███╗
  ██╔══██╗██║██║   ██║     ██╔══██╗██╔══██║██║╚██╗██║██║   ██║
  ██████╔╝██║╚██████╔╝     ██████╔╝██║  ██║██║ ╚████║╚██████╔╝
  ╚═════╝ ╚═╝ ╚═════╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝
`.trim();

export function InitialLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#09090b",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "ui-monospace, monospace",
      }}
    >
      <pre
        style={{
          color: "#f4f4f5",
          fontSize: "clamp(5px, 1.2vw, 11px)",
          lineHeight: 1.3,
          marginBottom: "2.5rem",
          whiteSpace: "pre",
        }}
      >
        {LOGO}
      </pre>

      <div
        style={{
          width: 28, height: 28,
          border: "2px solid #3f3f46",
          borderTopColor: "#f59e0b",
          borderRadius: "50%",
          animation: "bb-spin 0.7s linear infinite",
          marginBottom: "1rem",
        }}
      />

      <style>{`@keyframes bb-spin { to { transform: rotate(360deg); } }`}</style>

      <p
        style={{
          color: "#52525b",
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          marginTop: "1rem",
        }}
      >
        Geopolitical Intelligence
      </p>
    </div>
  );
}
