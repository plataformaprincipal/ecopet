"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck, MapPin, Clock, Star, MessageCircle, Heart, Package, Wrench,
  ChevronRight, Shield, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/marketplace/rating-stars";
import { useMarketplaceStore } from "@/store/marketplace-store";
import type { MarketplacePartner } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  petshop: "Pet Shop", clinic: "Clínica", veterinarian: "Veterinário",
  provider: "Prestador", ong: "ONG", seller: "Seller", store: "Loja",
};

interface PartnerSearchCardProps {
  partner: MarketplacePartner;
  productCount: number;
  serviceCount: number;
}

export function PartnerSearchCard({ partner, productCount, serviceCount }: PartnerSearchCardProps) {
  const { toggleFavoritePartner, isFavoritePartner } = useMarketplaceStore();
  const fav = isFavoritePartner(partner.id);
  const qualityIndex = partner.qualityIndex ?? Math.round(partner.rating * 20);
  const isOpen = partner.isOpen ?? true;

  return (
    <div className="card-premium overflow-hidden rounded-[16px] border border-ecopet-gray/10">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:p-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-md lg:h-20 lg:w-20">
          <Image src={partner.avatar} alt={partner.name} fill className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/marketplace/parceiro/${partner.id}`} className="font-display text-lg font-bold hover:text-ecopet-green">
              {partner.tradeName}
            </Link>
            {partner.isVerified && (
              <Badge variant="verified" className="gap-0.5"><BadgeCheck className="h-3 w-3" /> Verificado</Badge>
            )}
            <Badge variant={isOpen ? "default" : "secondary"} className={cn(isOpen ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-600")}>
              {isOpen ? "Aberto" : "Fechado"}
            </Badge>
          </div>

          <p className="text-sm text-ecopet-gray">{TYPE_LABELS[partner.type] ?? partner.type}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <RatingStars rating={partner.rating} size="sm" />
            <span className="text-ecopet-gray">{partner.reviewCount} avaliações</span>
            <span className="flex items-center gap-1 text-ecopet-gray"><MapPin className="h-3.5 w-3.5" /> {partner.location} · {partner.distanceKm} km</span>
            <span className="flex items-center gap-1 text-ecopet-gray"><Clock className="h-3.5 w-3.5" /> {partner.responseTime}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-ecopet-green/10 px-2 py-0.5 font-medium text-ecopet-green">
              <Shield className="h-3 w-3" /> Qualidade {qualityIndex}%
            </span>
            <span className="flex items-center gap-1 rounded-full bg-ecopet-yellow/15 px-2 py-0.5 font-medium">
              <Truck className="h-3 w-3" /> Entrega ~{partner.avgDeliveryDays ?? 2}d
            </span>
            <span className="rounded-full bg-ecopet-gray/10 px-2 py-0.5">{partner.completionRate ?? 96}% conclusão</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {(partner.specialties ?? partner.categories).slice(0, 4).map((s) => (
              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
            ))}
          </div>

          <p className="mt-2 line-clamp-2 text-xs text-ecopet-gray">{partner.hours}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
          <Button size="sm" variant="default" asChild><Link href={`/marketplace/parceiro/${partner.id}`}>Ver perfil</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href={`/marketplace/chat?partner=${partner.id}`}><MessageCircle className="h-4 w-4" /> Conversar</Link></Button>
          <Button size="sm" variant={fav ? "default" : "outline"} onClick={() => toggleFavoritePartner(partner.id)}>
            <Heart className={cn("h-4 w-4", fav && "fill-white")} /> Seguir
          </Button>
          {productCount > 0 && (
            <Button size="sm" variant="ghost" asChild><Link href={`/marketplace/parceiro/${partner.id}?tab=products`}><Package className="h-4 w-4" /> Produtos ({productCount})</Link></Button>
          )}
          {serviceCount > 0 && (
            <Button size="sm" variant="ghost" asChild><Link href={`/marketplace/parceiro/${partner.id}?tab=services`}><Wrench className="h-4 w-4" /> Serviços ({serviceCount})</Link></Button>
          )}
        </div>
      </div>
    </div>
  );
}
