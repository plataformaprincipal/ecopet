"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { QuoteBuilder } from "@/components/ecosystem/quotes/quote-builder";
import { getQuotesForClient } from "@/lib/ecosystem/quotes-api";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

function OrcamentosContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const quotes = getQuotesForClient();

  if (isNew) {
    return (
      <QuoteBuilder
        partnerId=""
        partnerName=""
        onSend={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">{t("empty.quotes.title")}</h2>
        <p className="text-sm text-ecopet-gray">{t("empty.quotes.subtitle")}</p>
      </div>
      {quotes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("empty.quotes.noQuotes")}
          description={t("empty.quotes.noQuotesHint")}
        />
      ) : null}
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
