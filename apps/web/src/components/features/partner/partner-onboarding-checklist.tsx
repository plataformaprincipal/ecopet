"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { PartnerOnboardingSnapshot } from "@/lib/partner/onboarding";

const ITEMS: Array<{ key: keyof PartnerOnboardingSnapshot["checklist"]; label: string }> = [
  { key: "cadastral", label: "Dados cadastrais" },
  { key: "commercial", label: "Dados comerciais" },
  { key: "banking", label: "Dados bancários" },
  { key: "documents", label: "Documentação" },
  { key: "mercadoPago", label: "Mercado Pago conectado" },
  { key: "terms", label: "Termos aceitos" },
  { key: "approved", label: "Aprovado pela EccoPet" },
];

export function PartnerOnboardingChecklist({
  snapshot,
  connectHref = "/partner/financeiro",
}: {
  snapshot: PartnerOnboardingSnapshot;
  connectHref?: string;
}) {
  return (
    <section
      className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 dark:border-amber-500/20 dark:bg-amber-500/10"
      data-testid="partner-onboarding-checklist"
    >
      <h2 className="text-base font-semibold">{snapshot.message}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Status: {snapshot.status}</p>
      <ul className="mt-4 space-y-2">
        {ITEMS.map((item) => {
          const done = snapshot.checklist[item.key];
          return (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check className="h-4 w-4 text-ecopet-green" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
              <span className={done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
            </li>
          );
        })}
      </ul>
      {!snapshot.checklist.mercadoPago ? (
        <Link
          href={connectHref}
          className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
        >
          CONECTAR MERCADO PAGO
        </Link>
      ) : null}
    </section>
  );
}
