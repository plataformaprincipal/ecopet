"use client";

import Link from "next/link";
import { FileText, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoundationProfileForm } from "@/components/features/foundation/profile-form";
import { PartnerPageHeader } from "../partner-page-header";
import { PartnerStatusBadge } from "../partner-status-badge";
import type { PartnerAccessLevel } from "@/lib/partner/access";

type PartnerProfileManagementPageProps = {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    accountStatus: string;
  };
  accessLevel: PartnerAccessLevel;
  verificationStatus?: string | null;
};

export function PartnerProfileManagementPage({
  user,
  accessLevel,
  verificationStatus,
}: PartnerProfileManagementPageProps) {
  const needsCompletion = accessLevel === "limited";

  return (
    <div className="space-y-8">
      <PartnerPageHeader
        title="Perfil e Gestão"
        description="Dados comerciais, documentos, horários de funcionamento e configurações da sua loja."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PartnerStatusBadge
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
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Dados comerciais",
            desc: "CNPJ, razão social, categoria e contatos",
            href: "/perfil",
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
            desc: "Preferências de atendimento e notificações",
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

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Editar perfil</h2>
            <p className="text-sm text-zinc-500">
              Atualize endereço, horários, descrição e dados da empresa.
            </p>
          </div>
          {needsCompletion ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/conta/em-analise">Completar cadastro</Link>
            </Button>
          ) : null}
        </div>
        <FoundationProfileForm dashboardPath="/parceiro/perfil-gestao" />
      </section>
    </div>
  );
}
