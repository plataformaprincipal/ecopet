"use client";

import { useEffect, useRef } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";

/** Máscara de leitura e guia horizontal — segue o cursor. */
export function ReadingAssist() {
  const readingMask = useAccessibilityStore((s) => s.readingMask);
  const readingGuide = useAccessibilityStore((s) => s.readingGuide);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!readingMask && !readingGuide) return;

    function onMove(e: MouseEvent) {
      const y = e.clientY;
      document.documentElement.style.setProperty("--a11y-guide-y", `${y}px`);
      if (spotlightRef.current) {
        spotlightRef.current.style.top = `${y}px`;
      }
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [readingMask, readingGuide]);

  if (!readingMask && !readingGuide) return null;

  return (
    <>
      {readingMask && (
        <div
          ref={spotlightRef}
          className="pointer-events-none fixed left-0 z-[9997] h-[100px] w-full -translate-y-1/2"
          style={{ boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.78)" }}
          aria-hidden="true"
        />
      )}
      {readingGuide && (
        <div
          className="a11y-reading-guide-line"
          style={{ top: "var(--a11y-guide-y, 50%)" }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
