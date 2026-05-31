"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { CustomQuoteCard } from "@/components/ecosystem/quotes/custom-quote-card";
import { QuoteBuilder } from "@/components/ecosystem/quotes/quote-builder";
import { getQuotesForClient } from "@/lib/ecosystem/mock-data";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function OrcamentosContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";
  const { addQuoteToCart } = useMarketplaceStore();
  const quotes = getQuotesForClient();

  const filtered = selectedId ? quotes.filter((q) => q.id === selectedId) : quotes;

  const byStatus = {
    all: quotes,
    sent: quotes.filter((q) => q.status === "sent"),
    accepted: quotes.filter((q) => q.status === "accepted"),
    negotiating: quotes.filter((q) => q.status === "negotiating"),
    rejected: quotes.filter((q) => ["rejected", "expired"].includes(q.status)),
  };

  if (isNew) {
    return (
      <QuoteBuilder
        partnerId="mp1"
        partnerName="Pet Shop Amigo"
        onSend={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Orçamentos Personalizados</h2>
        <p className="text-sm text-ecopet-gray">Recebidos, aceitos, em negociação e convertidos em compra</p>
      </div>

      <Tabs defaultValue={selectedId ? "all" : "all"}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Todos <Badge className="ml-1">{byStatus.all.length}</Badge></TabsTrigger>
          <TabsTrigger value="sent">Recebidos ({byStatus.sent.length})</TabsTrigger>
          <TabsTrigger value="accepted">Aceitos ({byStatus.accepted.length})</TabsTrigger>
          <TabsTrigger value="negotiating">Negociação ({byStatus.negotiating.length})</TabsTrigger>
          <TabsTrigger value="rejected">Recusados/Expirados ({byStatus.rejected.length})</TabsTrigger>
        </TabsList>

        {(["all", "sent", "accepted", "negotiating", "rejected"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-6 space-y-4">
            {(key === "all" ? filtered : byStatus[key]).map((q) => (
              <CustomQuoteCard
                key={q.id}
                quote={q}
                onAddToCart={addQuoteToCart}
                onAccept={() => addQuoteToCart(q.id)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function OrcamentosPage() {
  return (
    <MarketplacePageWrapper title="Orçamentos" className="mx-auto max-w-4xl flex-1 p-4 lg:p-8">
      <Suspense fallback={<div className="animate-pulse h-64 rounded-2xl bg-ecopet-gray/10" />}>
        <OrcamentosContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
