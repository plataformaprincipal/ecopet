"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  HelpCircle,
  MessageSquare,
  PawPrint,
  PenSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OngPageHeader } from "../ong-page-header";
import { OngPageSkeleton } from "../ong-skeleton";
import { OngStatusBadge } from "../ong-status-badge";
import { OngEmptyState } from "../ong-empty-state";
import type { OngDashboardSummary } from "@/lib/ong/ai-insights";
import type { OngAccessLevel } from "@/lib/ong/access";

type OngDashboardHomeProps = {
  userName: string;
  accountStatus: string;
  verificationStatus?: string | null;
  accessLevel: OngAccessLevel;
};

export function OngDashboardHome({
  userName,
  accountStatus,
  verificationStatus,
  accessLevel,
}: OngDashboardHomeProps) {
  const [summary, setSummary] = useState<OngDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ong/dashboard/summary", { credentials: "include" });
      const json = await res.json();
      if (json.success) setSummary(json.data.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <OngPageSkeleton />;

  const firstName = userName.split(" ")[0];
  const canPublish = accessLevel === "full";

  return (
    <div className="space-y-8">
      <OngPageHeader
        title={`Olá, ${firstName}`}
        description="Painel da sua ONG ou protetor — acompanhe animais, adoções, mensagens e publicações."
        actions={
          <OngStatusBadge
            accountStatus={accountStatus}
            verificationStatus={verificationStatus}
          />
        }
      />

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Animais cadastrados", value: summary.animalsCount, icon: PawPrint },
            { label: "Adoções em andamento", value: summary.adoptionsInProgress, icon: Heart },
            { label: "Pedidos de ajuda", value: summary.helpRequests, icon: HelpCircle },
            { label: "Mensagens pendentes", value: summary.pendingMessages, icon: MessageSquare },
            { label: "Publicações (30 dias)", value: summary.recentPostsCount, icon: PenSquare },
            { label: "Disponíveis para adoção", value: summary.availableAnimals, icon: UserCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">{label}</p>
                <Icon className="h-4 w-4 text-emerald-600/70" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canPublish ? (
          <>
            <Button asChild size="sm">
              <Link href="/ong/adocoes">Cadastrar animal</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/ong/comunidade">Criar publicação</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/ong/adocoes">Ver solicitações</Link>
            </Button>
          </>
        ) : (
          <Button asChild size="sm">
            <Link href="/ong/perfil-gestao">Completar perfil</Link>
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link href="/ong/atividades-ia">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Atividades
          </Link>
        </Button>
      </div>

      {summary && summary.insights.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            <Sparkles className="h-4 w-4" aria-hidden />
            Recomendações
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.insights.slice(0, 4).map((rec) => (
              <Link
                key={rec.id}
                href={rec.href ?? "/ong/atividades-ia"}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium text-zinc-900 dark:text-white">{rec.title}</p>
                <p className="mt-1 text-sm text-zinc-500">{rec.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Animais recentes</h2>
        {!summary || summary.recentAnimals.length === 0 ? (
          <OngEmptyState
            icon={PawPrint}
            title="Nenhum animal cadastrado"
            description={
              canPublish
                ? "Cadastre animais disponíveis para adoção e acompanhe o status aqui."
                : "Após a aprovação da sua conta, você poderá cadastrar animais para adoção."
            }
            actionLabel={canPublish ? "Cadastrar animal" : "Completar perfil"}
            actionHref={canPublish ? "/ong/adocoes" : "/ong/perfil-gestao"}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.recentAnimals.map((animal) => (
              <Link
                key={animal.id}
                href="/ong/adocoes"
                className="rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium text-zinc-900 dark:text-white">{animal.name}</p>
                <p className="text-zinc-500">
                  {animal.status} ·{" "}
                  {new Date(animal.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
