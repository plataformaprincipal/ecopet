"use client";

import { useCallback, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AuthRequiredModal } from "@/components/features/social/feed/auth-required-modal";

export function useMarketplaceAuthGate() {
  const { status } = useAuthSession();
  const [open, setOpen] = useState(false);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (status === "authenticated") {
        action?.();
        return true;
      }
      setOpen(true);
      return false;
    },
    [status]
  );

  const AuthModal = (
    <AuthRequiredModal
      open={open}
      onOpenChange={setOpen}
      titleKey="marketplace.authModal.title"
      descriptionKey="marketplace.authModal.description"
      signInKey="marketplace.authModal.signIn"
      createAccountKey="marketplace.authModal.createAccount"
    />
  );

  return { requireAuth, AuthModal, isAuthenticated: status === "authenticated", isLoading: status === "loading" };
}
