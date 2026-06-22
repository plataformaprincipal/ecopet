"use client";

import Link from "next/link";
import { FileText, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoundationProfileForm } from "@/components/features/foundation/profile-form";
import { LogoutButton } from "@/components/shared/auth/logout-button";
import { OngPageHeader } from "../ong-page-header";
import { OngStatusBadge } from "../ong-status-badge";
import { OngAccessibilitySettings, OngTranslationSettings } from "../ong-settings-panels";
import type { OngAccessLevel } from "@/lib/ong/access";

type OngProfileManagementPageProps = {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    accountStatus: string;
  };
  accessLevel: OngAccessLevel;
  verificationStatus?: string | null;
};

export function OngProfileManagementPage({
  user,
  accessLevel,
  verificationStatus,
}: OngProfileManagementPageProps) {
  const needsCompletion = accessLevel === "limited";
  const isBlocked = accessLevel === "blocked";

  return (
    <div className="space-y-8">
      <OngPageHeader
        title="Perfil e Gestão"
        description="Dados da ONG/protetor, documentos, contatos, horários e configurações da conta."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OngStatusBadge
              accountStatus={user.accountStatus}
              verificationStatus={verificationStatus}
            />
            {needsCompletion ? (
              <Button asChild size="sm" className="gap-2">
                <Link href="/conta/em-analise">
                  <Send className="h-4 w-4" />
                  Enviar para análise
                </Link>
              </Button>
            ) : null}
            <LogoutButton variant="button" className="inline-flex" />
          </div>
        }
      />

      {isBlocked ? (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-4 text-sm text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
          Sua conta está suspensa ou foi recusada. Ações públicas estão bloqueadas. Entre em contato
          com o suporte se precisar de ajuda.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Dados institucionais",
            desc: "CNPJ, responsável, endereço e contatos",
            href: "#editar-perfil",
            icon: Settings,
          },
          {
            title: "Documentos",
            desc: "Envie comprovantes e documentação de verificação",
            href: "/conta/em-analise",
            icon: FileText,
          },
          {
            title: "Configurações",
            desc: "Preferências de comunicação e notificações",
            href: "/configuracoes",
            icon: Settings,
          },
        ].map(({ title, desc, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
          >
            <Icon className="h-5 w-5 text-zinc-500" />
            <h3 className="mt-3 font-medium text-zinc-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{desc}</p>
          </Link>
        ))}
      </div>

      <section
        id="editar-perfil"
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Editar perfil</h2>
            <p className="text-sm text-zinc-500">
              Atualize endereço, horários, descrição e dados da instituição.
            </p>
          </div>
          {needsCompletion ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/conta/em-analise">Completar cadastro</Link>
            </Button>
          ) : null}
        </div>
        <FoundationProfileForm dashboardPath="/ong/perfil-gestao" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <OngTranslationSettings />
        <OngAccessibilitySettings />
      </div>
    </div>
  );
}
