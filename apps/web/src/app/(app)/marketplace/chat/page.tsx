"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Marketplace chat → redireciona para a central TalkJS real.
 * Aceita ?partner= / ?userId= / ?contextType= / ?contextId=
 */
function MarketplaceChatRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = new URLSearchParams();
    const partner = searchParams.get("partner") ?? searchParams.get("userId");
    const contextType = searchParams.get("contextType");
    const contextId = searchParams.get("contextId");
    if (partner) qs.set("partner", partner);
    if (contextType) qs.set("contextType", contextType);
    if (contextId) qs.set("contextId", contextId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    router.replace(`/dashboard/messages${suffix}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[320px] items-center justify-center p-8 text-sm text-muted-foreground" role="status">
      Abrindo mensagens…
    </div>
  );
}

export default function MarketplaceChatPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl animate-pulse p-8">
          <div className="h-96 rounded-2xl bg-muted/40" />
        </div>
      }
    >
      <MarketplaceChatRedirect />
    </Suspense>
  );
}
