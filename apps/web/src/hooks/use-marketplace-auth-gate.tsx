"use client";

import { useCallback, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AuthRequiredModal } from "@/components/features/social/feed/auth-required-modal";

export function useMarketplaceAuthGate() {
  const { status } = useAuthSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [intentUrl, setIntentUrl] = useState<string | undefined>();

  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const requireAuth = useCallback(
    (action?: () => void, intent?: string) => {
      if (status === "authenticated") {
        action?.();
        return true;
      }
      setIntentUrl(intent ?? currentUrl);
      setOpen(true);
      return false;
    },
    [status, currentUrl]
  );

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

  return { requireAuth, AuthModal, isAuthenticated: status === "authenticated", isLoading: status === "loading" };
}
