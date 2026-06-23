"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Package, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartConversationButton } from "@/components/messages/StartConversationButton";
import type { MarketplacePartner } from "@/lib/marketplace/types";
import { useTranslation } from "@/providers/i18n-provider";

export function PartnerCard({ partner }: { partner: MarketplacePartner }) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
            {partner.avatar ? (
              <Image src={partner.avatar} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-ecopet-green">
                {partner.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/parceiros/${partner.id}`} className="font-semibold hover:text-ecopet-green">
              {partner.name}
            </Link>
            {partner.location && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden />
                {partner.location}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
              {partner.rating.toFixed(1)} ({partner.reviewCount})
            </p>
          </div>
        </div>
        {partner.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{partner.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {(partner.productCount ?? partner.salesCount) > 0 && (
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {partner.productCount ?? 0} produtos</span>
          )}
          {(partner.serviceCount ?? 0) > 0 && (
            <span className="flex items-center gap-1"><Scissors className="h-3 w-3" /> {partner.serviceCount} serviços</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/parceiros/${partner.id}`}>{t("marketplace.viewPartner")}</Link>
          </Button>
          <StartConversationButton
            size="sm"
            participantUserId={partner.id}
            contextType="GENERAL"
            label={t("messagesModule.contactPartner")}
            ariaLabel={t("messagesModule.contactPartner")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
