"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  ClipboardList,
  Heart,
  KeyRound,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/shared/auth/logout-button";
import { FoundationProfileForm } from "@/components/features/foundation/profile-form";
import { ClientPageHeader } from "../client-page-header";
import {
  ClientAccessibilitySettings,
  ClientTranslationSettings,
} from "../client-settings-panels";

const QUICK_LINKS = [
  { href: "/dashboard/client/orders", label: "Meus pedidos", icon: ClipboardList },
  { href: "/dashboard/client/appointments", label: "Meus agendamentos", icon: Calendar },
  { href: "/cliente/marketplace", label: "Favoritos", icon: Heart },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/recuperar-senha", label: "Alterar senha", icon: KeyRound },
];

export function ClientProfileManagementPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      <ClientPageHeader
        title="Perfil e Gestão"
        description="Dados pessoais, pedidos, preferências e configurações da sua conta."
        actions={<LogoutButton variant="button" redirectTo="/" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-4 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-ecopet-green/10">
              <Icon className="h-5 w-5 text-ecopet-green" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-sm font-medium text-ecopet-dark dark:text-white">{label}</span>
          </Link>
        ))}
        <Link
          href="/dashboard/client/appointments"
          className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-4 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-ecopet-green/10">
            <Star className="h-5 w-5 text-ecopet-green" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-sm font-medium text-ecopet-dark dark:text-white">Minhas avaliações</span>
        </Link>
      </div>

      <ClientTranslationSettings />
      <ClientAccessibilitySettings />

      <section className="rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-6 shadow-[var(--shadow-sm)] dark:border-white/10 dark:bg-ecopet-dark-card">
        <h2 className="font-display text-lg font-semibold text-ecopet-dark dark:text-white">Dados pessoais</h2>
        <p className="mt-1 text-sm text-ecopet-gray dark:text-white/70">Atualize nome, contato e endereço.</p>
        <div className="mt-6">
          <FoundationProfileForm dashboardPath="/cliente/perfil" />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-[var(--radius-button)]">
          <Link href="/configuracoes">Configurações completas</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-[var(--radius-button)]">
          <Link href="/dashboard/messages">Mensagens</Link>
        </Button>
      </div>
    </div>
  );
}
