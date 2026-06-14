"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Calendar, FileText, Home, MapPin, Scale, Sparkles, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./rating-stars";
import { formatMpPrice, AI_TAG_LABELS } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import type { MarketplaceService } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import { useAriaAnnounce } from "@/components/shared/accessibility/aria-live-region";

interface ServiceCardProps {
  service: MarketplaceService;
  compact?: boolean;
}

export function ServiceCard({ service, compact }: ServiceCardProps) {
  const { t } = useTranslation();
  const announce = useAriaAnnounce();
  const { addToCart, toggleFavoriteService, toggleCompare, isFavoriteService, isInCompare } =
    useMarketplaceStore();
  const fav = isFavoriteService(service.id);
  const comparing = isInCompare("service", service.id);

  function handleAddToCart() {
    addToCart({
      type: "service",
      itemId: service.id,
      name: service.name,
      image: service.image,
      price: service.price,
      quantity: 1,
      partnerId: service.partnerId,
      partnerName: service.partner.name,
    });
    announce(t("marketplace.addedToCart", { name: service.name }));
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/5">
      <Link href={`/marketplace/servico/${service.id}`} className="relative block aspect-video overflow-hidden bg-gray-100">
        <Image src={service.image} alt={service.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width:768px) 100vw, 33vw" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge className="bg-ecopet-dark text-white">{t("marketplace.serviceBadge")}</Badge>
          {service.emergency && <Badge className="bg-red-500 text-white">{t("marketplace.emergency")}</Badge>}
          {service.aiTag && (
            <Badge variant="premium" className="gap-0.5">
              <Sparkles className="h-3 w-3" />
              {AI_TAG_LABELS[service.aiTag]}
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3 lg:p-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-ecopet-green">{service.category}</p>
        <Link href={`/marketplace/servico/${service.id}`}>
          <h3 className="mt-0.5 font-semibold leading-snug hover:text-ecopet-green">{service.name}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-ecopet-gray">{service.description}</p>

        <Link href={`/marketplace/parceiro/${service.partnerId}`} className="mt-2 flex items-center gap-1 text-xs text-ecopet-gray hover:text-ecopet-green">
          {service.partner.isVerified && <BadgeCheck className="h-3 w-3 text-blue-500" />}
          {service.partner.name}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xs text-ecopet-gray">{t("marketplace.fromPrice")}</span>
          <span className="text-lg font-bold text-ecopet-green">{formatMpPrice(service.price)}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ecopet-gray">
          <RatingStars rating={service.rating} />
          <span>({service.reviewCount})</span>
          <span>~{service.durationMin} min</span>
          {service.homeService && (
            <span className="flex items-center gap-0.5"><Home className="h-3 w-3" /> {t("marketplace.homeService")}</span>
          )}
          {service.partner.distanceKm != null && (
            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {service.partner.distanceKm} km</span>
          )}
        </div>

        {!compact && (
          <div className="mt-auto flex gap-1.5 pt-3">
            <Button size="sm" className="flex-1" onClick={handleAddToCart}>
              <Calendar className="h-4 w-4" />
              {t("marketplace.schedule")}
            </Button>
            <Link href={`/marketplace/personalizados?service=${service.id}`}>
              <Button size="sm" variant="outline" className="px-2.5" aria-label={t("marketplace.quote")}>
                <FileText className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className={cn("px-2.5", fav && "border-red-300 text-red-500")}
              onClick={() => {
                toggleFavoriteService(service.id, service);
                announce(fav ? t("marketplace.removedFromFavorites") : t("marketplace.addedToFavorites"));
              }}
              aria-label={t("marketplace.favorite")}
            >
              <Heart className={cn("h-4 w-4", fav && "fill-red-500")} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn("px-2.5", comparing && "text-ecopet-green")}
              onClick={() => {
                toggleCompare("service", service.id, service);
                announce(comparing ? t("marketplace.removedFromCompare") : t("marketplace.addedToCompare"));
              }}
              aria-label={t("marketplace.compare")}
            >
              <Scale className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
