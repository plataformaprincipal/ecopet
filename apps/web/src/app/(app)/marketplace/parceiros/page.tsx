"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { PartnerCard } from "@/components/features/marketplace/partner-card";
import { fetchPartners } from "@/lib/marketplace/api";
import type { MarketplacePartner } from "@/lib/marketplace/types";
import { useTranslation } from "@/providers/i18n-provider";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";

export default function MarketplaceParceirosPage() {
  const { t } = useTranslation();
  const [partners, setPartners] = useState<MarketplacePartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPartners().then(setPartners).finally(() => setLoading(false));
  }, []);

  return (
    <MarketplacePageWrapper title={t("nav.partners")} className="mx-auto max-w-6xl flex-1 p-4 lg:p-8">
      {loading ? (
        <MarketplaceGridSkeleton count={6} />
      ) : partners.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("marketplace.emptyPartners")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </div>
      )}
    </MarketplacePageWrapper>
  );
}
