"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerAccessLevel } from "@/lib/partner/access";

type PartnerPendingBannerProps = {
  accessLevel: PartnerAccessLevel;
  className?: string;
};

export function PartnerPendingBanner({ accessLevel, className }: PartnerPendingBannerProps) {
  if (accessLevel === "full") return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
        <div>
          <p className="font-medium">Conta em análise</p>
          <p className="mt-0.5 text-amber-800/90 dark:text-amber-100/80">
            Enquanto aguarda aprovação, você pode completar seu perfil e acompanhar a
            Comunidade EcoPet. Marketplace, Agenda e Atividades com IA serão liberados após
            aprovação.
          </p>
        </div>
      </div>
      <Link
        href="/parceiro/perfil-gestao"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
      >
        Completar cadastro
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
