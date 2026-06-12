"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, MapPin, BadgeCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./rating-stars";
import { useMarketplaceStore } from "@/store/marketplace-store";
import type { MarketplacePartner } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

const PARTNER_TYPE_LABELS: Record<string, string> = {
  petshop: "Pet Shop",
  clinic: "Clínica Veterinária",
  veterinarian: "Veterinário",
  provider: "Prestador de Serviço",
  ong: "ONG",
  seller: "Seller",
  store: "Loja Parceira",
};

interface PartnerCardProps {
  partner: MarketplacePartner;
  horizontal?: boolean;
}

export function PartnerCard({ partner, horizontal }: PartnerCardProps) {
  const { toggleFavoritePartner, isFavoritePartner } = useMarketplaceStore();
  const fav = isFavoritePartner(partner.id);

  if (horizontal) {
    return (
      <Link
        href={`/marketplace/parceiro/${partner.id}`}
        className="flex items-center gap-4 rounded-2xl border border-ecopet-gray/10 bg-white p-4 transition-all hover:shadow-md dark:bg-white/5"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          <Image src={partner.avatar} alt={partner.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate font-semibold">{partner.tradeName}</h3>
            {partner.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />}
          </div>
          <p className="text-xs text-ecopet-gray">{PARTNER_TYPE_LABELS[partner.type]}</p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <RatingStars rating={partner.rating} />
            <span className="text-ecopet-gray">· {partner.distanceKm} km</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-sm transition-all hover:shadow-lg dark:bg-white/5">
      <Link href={`/marketplace/parceiro/${partner.id}`} className="relative block h-24 overflow-hidden">
        <Image src={partner.cover} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </Link>
      <div className="relative px-4 pb-4">
        <div className="relative -mt-8 mb-2">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border-4 border-white shadow-md dark:border-[#0f1419]">
            <Image src={partner.avatar} alt={partner.name} fill className="object-cover" />
          </div>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1">
              <Link href={`/marketplace/parceiro/${partner.id}`}>
                <h3 className="font-semibold hover:text-ecopet-green">{partner.tradeName}</h3>
              </Link>
              {partner.isVerified && <Badge variant="verified">Verificado</Badge>}
            </div>
            <p className="text-xs text-ecopet-gray">{PARTNER_TYPE_LABELS[partner.type]}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className={cn("h-8 w-8 shrink-0", fav && "text-red-500")}
            onClick={() => toggleFavoritePartner(partner.id, partner)}
          >
            <Heart className={cn("h-4 w-4", fav && "fill-red-500")} />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ecopet-gray">
          <RatingStars rating={partner.rating} />
          <span>({partner.reviewCount})</span>
          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {partner.distanceKm} km</span>
          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {partner.responseTime}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-ecopet-gray">{partner.description}</p>
        <div className="mt-3 flex gap-2">
          <Link href={`/marketplace/parceiro/${partner.id}`} className="flex-1">
            <Button size="sm" className="w-full">Ver perfil</Button>
          </Link>
          <Button size="sm" variant="outline" className="px-2.5">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
