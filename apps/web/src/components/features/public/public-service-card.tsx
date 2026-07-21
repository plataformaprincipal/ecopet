"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Scissors, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency } from "@/lib/i18n/format";
import { LoginRequiredModal } from "./login-required-modal";
import { useState } from "react";

export type PublicServiceCardData = {
  id: string;
  name: string;
  price: number;
  category: string;
  rating?: number;
  reviewCount?: number;
  provider?: { partnerProfile?: { businessName?: string; city?: string } };
  featured?: boolean;
};

type PublicServiceCardProps = {
  service: PublicServiceCardData;
  detailHref?: string;
};

export function PublicServiceCard({ service, detailHref }: PublicServiceCardProps) {
  const { isAuthenticated } = useAuthGate();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [bookModal, setBookModal] = useState(false);
  const partnerName = service.provider?.partnerProfile?.businessName;
  const city = service.provider?.partnerProfile?.city;
  const href = detailHref ?? `/marketplace/servico/${service.id}`;

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-gradient-to-br from-white to-ecopet-cream/40 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:from-ecopet-dark-card dark:to-ecopet-dark">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-ecopet-green/10">
            <Scissors className="h-7 w-7 text-ecopet-green" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            {service.featured ? (
              <span className="mb-1 inline-block rounded-full bg-ecopet-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ecopet-green">
                {t("pub.card.featured")}
              </span>
            ) : null}
            <Link href={href}>
              <h3 className="font-display font-semibold text-ecopet-dark dark:text-white">{service.name}</h3>
            </Link>
            <p className="mt-1 text-lg font-bold text-ecopet-green">{formatCurrency(service.price, locale)}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-ecopet-gray dark:text-white/60">
              {service.rating ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-ecopet-green text-ecopet-green" strokeWidth={2} aria-hidden />
                  {service.rating.toFixed(1)}
                </span>
              ) : null}
              <span>{service.category.replace(/_/g, " ")}</span>
              {partnerName ? <span>{partnerName}</span> : null}
              {city ? <span>{city}</span> : null}
            </div>
          </div>
        </div>
        <div className="mt-auto flex gap-2 border-t border-ecopet-gray/10 p-4 dark:border-white/5">
          <Button asChild variant="outline" size="sm" className="flex-1 rounded-[var(--radius-button)]">
            <Link href={href}>{t("pub.card.viewDetails")}</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-[var(--radius-button)]"
            onClick={() => {
              if (isAuthenticated) {
                router.push(href);
              } else {
                setBookModal(true);
              }
            }}
          >
            <Calendar className="mr-1 h-4 w-4" strokeWidth={2} aria-hidden />
            {t("pub.card.book")}
          </Button>
        </div>
      </article>
      <LoginRequiredModal
        open={bookModal}
        onOpenChange={setBookModal}
        titleKey="public.authModal.bookTitle"
        descriptionKey="public.authModal.bookDescription"
      />
    </>
  );
}
