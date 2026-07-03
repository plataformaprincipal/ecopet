"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Loader2 } from "lucide-react";
import type { ConversationContextType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { AuthRequiredModal } from "@/components/features/social/feed/auth-required-modal";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type StartConversationButtonProps = {
  participantUserId: string;
  contextType?: ConversationContextType;
  contextId?: string | null;
  title?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  ariaLabel?: string;
};

export function StartConversationButton({
  participantUserId,
  contextType = "GENERAL",
  contextId = null,
  title,
  label,
  variant = "default",
  size = "default",
  className,
  ariaLabel,
}: StartConversationButtonProps) {
  const router = useRouter();
  const { status } = useAuthSession();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  async function startConversation() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantUserId,
          contextType,
          contextId,
          title,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? t("messagesModule.error"));
      }
      const id = json.data.conversationId ?? json.data.conversation?.id;
      router.push(`/dashboard/messages/${id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (status !== "authenticated") {
      setAuthOpen(true);
      return;
    }
    void startConversation();
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={handleClick}
        disabled={loading || status === "loading"}
        aria-label={ariaLabel ?? label}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {label}
      </Button>
      <AuthRequiredModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        titleKey="messagesModule.authModal.title"
        descriptionKey="messagesModule.authModal.description"
        signInKey="messagesModule.authModal.signIn"
        createAccountKey="messagesModule.authModal.createAccount"
      />
    </>
  );
}
