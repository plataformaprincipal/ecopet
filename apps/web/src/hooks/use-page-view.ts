"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics/pageviews";
import { shouldSendToGoogle } from "@/lib/analytics/config";

/**
 * Page view manual em um subtree (opcional).
 * O provider raiz já rastreia rotas automaticamente — use só se precisar forçar.
 */
export function usePageView(enabled = true) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!enabled || !shouldSendToGoogle()) return;
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname || "/";
    trackPageView({ path });
  }, [enabled, pathname, searchParams]);
}
