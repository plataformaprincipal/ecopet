"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AuthRequiredModal } from "@/components/features/social/feed/auth-required-modal";

export function useMarketplaceAuthGate() {
  const { status } = useAuthSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [intentUrl, setIntentUrl] = useState<string | undefined>();
  const queuedAction = useRef<(() => void) | null>(null);

  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const requireAuth = useCallback(
    (action?: () => void, intent?: string) => {
      if (isLoading) {
        queuedAction.current = action ?? null;
        if (intent) setIntentUrl(intent);
        return false;
      }
      if (isAuthenticated) {
        action?.();
        return true;
      }
      queuedAction.current = null;
      setIntentUrl(intent ?? currentUrl);
      setOpen(true);
      return false;
    },
    [isAuthenticated, isLoading, currentUrl]
  );

  if (!isLoading && isAuthenticated && queuedAction.current) {
    const next = queuedAction.current;
    queuedAction.current = null;
    queueMicrotask(() => next());
  }

  const AuthModal = (
    <AuthRequiredModal
      open={open}
      onOpenChange={setOpen}
      titleKey="marketplace.authModal.title"
      descriptionKey="marketplace.authModal.description"
      signInKey="marketplace.authModal.signIn"
      createAccountKey="marketplace.authModal.createAccount"
      callbackUrl={intentUrl ?? currentUrl}
    />
  );

  return { requireAuth, AuthModal, isAuthenticated, isLoading };
}
