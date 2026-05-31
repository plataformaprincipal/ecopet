"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { ChatHub } from "@/components/ecosystem/chat/chat-hub";

function ChatContent() {
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as "client" | "partner" | "ngo") ?? "client";
  const partner = searchParams.get("partner") ?? undefined;
  const initialId = partner ? "c1" : undefined;

  return <ChatHub role={role} initialConversationId={initialId} />;
}

export default function MarketplaceChatPage() {
  return (
    <MarketplacePageWrapper title="Mensagens" className="mx-auto max-w-6xl flex-1 p-4 lg:p-8">
      <Suspense fallback={<div className="animate-pulse h-96 rounded-2xl bg-ecopet-gray/10" />}>
        <ChatContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
