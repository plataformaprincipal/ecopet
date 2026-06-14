"use client";

import { createContext, useCallback, useContext, useState } from "react";

const AriaLiveContext = createContext<(msg: string, politeness?: "polite" | "assertive") => void>(() => {});

export function AriaLiveProvider({ children }: { children: React.ReactNode }) {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");

  const announce = useCallback((msg: string, politeness: "polite" | "assertive" = "polite") => {
    if (politeness === "assertive") {
      setAssertive("");
      requestAnimationFrame(() => setAssertive(msg));
    } else {
      setPolite("");
      requestAnimationFrame(() => setPolite(msg));
    }
  }, []);

  return (
    <AriaLiveContext.Provider value={announce}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertive}
      </div>
    </AriaLiveContext.Provider>
  );
}

export function useAriaAnnounce() {
  return useContext(AriaLiveContext);
}
