"use client";

import Link from "next/link";
import { Accessibility } from "lucide-react";
import { LanguageSelector } from "@/components/features/i18n/language-selector";

export function ClientAccessibilitySettings() {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
      <div className="flex items-center gap-2">
        <Accessibility className="h-5 w-5 text-emerald-600" aria-hidden />
        <h3 className="font-medium text-zinc-900 dark:text-white">Acessibilidade</h3>
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        Contraste, fonte, Libras e outras preferências estão disponíveis na barra de acessibilidade
        global e em configurações detalhadas.
      </p>
      <Link
        href="/configuracoes"
        className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        Abrir configurações de acessibilidade
      </Link>
    </section>
  );
}

export function ClientTranslationSettings() {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
      <h3 className="font-medium text-zinc-900 dark:text-white">Idioma</h3>
      <p className="mt-1 text-sm text-zinc-500">Escolha o idioma da interface EcoPet.</p>
      <div className="mt-4">
        <LanguageSelector />
      </div>
    </section>
  );
}
