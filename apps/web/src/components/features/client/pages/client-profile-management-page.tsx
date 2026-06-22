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
    <div className="space-y-10">
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
            className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
          >
            <Icon className="h-5 w-5 text-emerald-600" aria-hidden />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
        <Link
          href="/dashboard/client/appointments"
          className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
        >
          <Star className="h-5 w-5 text-amber-500" aria-hidden />
          <span className="text-sm font-medium">Minhas avaliações</span>
        </Link>
      </div>

      <ClientTranslationSettings />
      <ClientAccessibilitySettings />

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-zinc-900/60">
        <h2 className="text-lg font-semibold">Dados pessoais</h2>
        <p className="mt-1 text-sm text-zinc-500">Atualize nome, contato e endereço.</p>
        <div className="mt-6">
          <FoundationProfileForm dashboardPath="/cliente/perfil" />
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/configuracoes">Configurações completas</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/messages">Mensagens</Link>
        </Button>
      </div>
    </div>
  );
}
