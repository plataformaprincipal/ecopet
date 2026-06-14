"use client";

import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

interface ChatHubProps {
  role?: "client" | "partner" | "ngo" | "system";
  initialConversationId?: string;
  showQuoteBuilder?: boolean;
}

export function ChatHub(_props: ChatHubProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[480px] items-center justify-center rounded-[16px] border border-ecopet-gray/10 bg-white p-8 dark:bg-white/[0.02]">
      <EmptyState
        icon={MessageCircle}
        title={t("empty.messages.title")}
        description={t("empty.messages.noConversations")}
      />
    </div>
  );
}
