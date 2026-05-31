"use client";

import { ServiceCard } from "@/components/marketplace/service-card";
import type { MarketplaceService } from "@/lib/marketplace/types";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PartnerServicesPreviewProps {
  services: MarketplaceService[];
  partnerId: string;
  partnerName: string;
  max?: number;
}

export function PartnerServicesPreview({ services, partnerId, partnerName, max = 3 }: PartnerServicesPreviewProps) {
  if (services.length === 0) return null;

  const visible = services.slice(0, max);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ecopet-gray">Serviços de {partnerName}</h4>
        {services.length > max && (
          <Link href={`/marketplace/parceiro/${partnerId}?tab=services`} className="flex items-center gap-1 text-xs font-medium text-ecopet-green hover:underline">
            Ver todos ({services.length}) <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((s) => <ServiceCard key={s.id} service={s} />)}
      </div>
    </div>
  );
}
