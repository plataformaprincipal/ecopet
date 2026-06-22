"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OngAccessLevel } from "@/lib/ong/access";

type OngPendingBannerProps = {
  accessLevel: OngAccessLevel;
  className?: string;
};

export function OngPendingBanner({ accessLevel, className }: OngPendingBannerProps) {
  if (accessLevel === "full") return null;

  if (accessLevel === "blocked") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-950 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
        role="status"
      >
        <div className="flex items-start gap-3">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />
          <div>
            <p className="font-medium">Conta restrita</p>
            <p className="mt-0.5 text-red-800/90 dark:text-red-100/80">
              Ações públicas estão bloqueadas. Acesse Perfil e Gestão para ver o status ou entrar em
              contato com o suporte.
            </p>
          </div>
        </div>
        <Link
          href="/ong/perfil-gestao"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          Ver perfil
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

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
            Complete seu cadastro enquanto aguarda aprovação. Comunidade, adoções e atividades serão
            liberadas após a análise da equipe EcoPet.
          </p>
        </div>
      </div>
      <Link
        href="/ong/perfil-gestao"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
      >
        Completar cadastro
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
