"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Scissors, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthGate } from "@/providers/auth-gate-provider";
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

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PublicServiceCardProps = {
  service: PublicServiceCardData;
  detailHref?: string;
};

export function PublicServiceCard({ service, detailHref }: PublicServiceCardProps) {
  const { isAuthenticated } = useAuthGate();
  const router = useRouter();
  const [bookModal, setBookModal] = useState(false);
  const partnerName = service.provider?.partnerProfile?.businessName;
  const city = service.provider?.partnerProfile?.city;
  const href = detailHref ?? `/marketplace/servico/${service.id}`;

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-gradient-to-br from-white to-ecopet-cream/30 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:from-zinc-900/60 dark:to-zinc-950/40">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ecopet-green/10">
            <Scissors className="h-7 w-7 text-ecopet-green" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            {service.featured ? (
              <span className="mb-1 inline-block rounded-full bg-ecopet-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-ecopet-green">
                Destaque
              </span>
            ) : null}
            <Link href={href}>
              <h3 className="font-semibold text-zinc-900 dark:text-white">{service.name}</h3>
            </Link>
            <p className="mt-1 text-lg font-bold text-ecopet-green">{formatPrice(service.price)}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
              {service.rating ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-ecopet-yellow text-ecopet-yellow" aria-hidden />
                  {service.rating.toFixed(1)}
                </span>
              ) : null}
              <span>{service.category.replace(/_/g, " ")}</span>
              {partnerName ? <span>{partnerName}</span> : null}
              {city ? <span>{city}</span> : null}
            </div>
          </div>
        </div>
        <div className="mt-auto flex gap-2 border-t border-zinc-100 p-4 dark:border-white/5">
          <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl">
            <Link href={href}>Ver detalhes</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-xl"
            onClick={() => {
              if (isAuthenticated) {
                router.push(href);
              } else {
                setBookModal(true);
              }
            }}
          >
            <Calendar className="mr-1 h-4 w-4" aria-hidden />
            Agendar
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
