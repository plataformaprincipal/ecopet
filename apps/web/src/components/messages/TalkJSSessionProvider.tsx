"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@talkjs/react";
import type { TalkJsSessionPayload } from "@/lib/talkjs/types";

type TalkJSSessionContextValue = {
  session: TalkJsSessionPayload | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
};

const TalkJSSessionContext = createContext<TalkJSSessionContextValue>({
  session: null,
  loading: true,
  error: null,
  configured: false,
});

export function useTalkJSSession() {
  return useContext(TalkJSSessionContext);
}

export function TalkJSSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TalkJsSessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(process.env.NEXT_PUBLIC_TALKJS_APP_ID);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/messages/talkjs/session");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.error?.message ?? "Erro ao conectar TalkJS.");
          return;
        }
        setSession(json.data as TalkJsSessionPayload);
      } catch {
        if (!cancelled) setError("Erro ao conectar TalkJS.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured]);

  const ctx = useMemo(
    () => ({ session, loading, error, configured }),
    [session, loading, error, configured]
  );

  if (!configured) {
    return <TalkJSSessionContext.Provider value={ctx}>{children}</TalkJSSessionContext.Provider>;
  }

  if (loading) {
    return (
      <TalkJSSessionContext.Provider value={ctx}>
        {children}
      </TalkJSSessionContext.Provider>
    );
  }

  if (error || !session) {
    return (
      <TalkJSSessionContext.Provider value={ctx}>
        {children}
      </TalkJSSessionContext.Provider>
    );
  }

  return (
    <TalkJSSessionContext.Provider value={ctx}>
      <Session
        appId={session.appId}
        userId={session.userId}
        signature={session.signature ?? undefined}
      >
        {children}
      </Session>
    </TalkJSSessionContext.Provider>
  );
}
