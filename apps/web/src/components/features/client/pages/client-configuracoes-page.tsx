"use client";

import Link from "next/link";
import { Bell, Download, Settings, ShieldCheck } from "lucide-react";
import { ClientPageHeader } from "../client-page-header";
import { ClientTranslationSettings, ClientAccessibilitySettings } from "../client-settings-panels";

const LINKS = [
  { href: "/configuracoes", label: "Configurações completas", description: "Preferências gerais da conta", icon: Settings },
  { href: "/notificacoes", label: "Notificações", description: "Preferências de avisos e alertas", icon: Bell },
  { href: "/api/account/export-data", label: "Exportar meus dados (LGPD)", description: "Baixe uma cópia dos seus dados", icon: Download, external: true },
  { href: "/configuracoes", label: "Privacidade e segurança", description: "Consentimentos e conta", icon: ShieldCheck },
];

export function ClientConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Configurações"
        description="Idioma, acessibilidade, notificações, privacidade e segurança."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map(({ href, label, description, icon: Icon, external }) => (
          <Link
            key={label}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
          >
            <Icon className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
              <p className="text-xs text-zinc-500">{description}</p>
            </div>
          </Link>
        ))}
      </div>

      <ClientTranslationSettings />
      <ClientAccessibilitySettings />
    </div>
  );
}
