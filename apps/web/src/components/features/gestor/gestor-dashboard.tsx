"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Users, ShoppingBag, AlertTriangle, Ticket } from "lucide-react";
import { AnalyticsCards } from "@/components/features/profile/shared/analytics-cards";
import { AIInsightsPanel } from "@/components/features/profile/shared/ai-insights-panel";
import { fetchGestorDashboard, type GestorDashboardMetrics } from "@/lib/gestor/api";
import { GestorError, GestorLoading } from "./gestor-shell";
import { formatMpPrice } from "@/lib/marketplace/config";

export function GestorDashboard() {
  const [data, setData] = useState<GestorDashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGestorDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;
  if (!data) return null;

  const cards = [
    { label: "Receita total", value: formatMpPrice(data.revenue.total), icon: TrendingUp, variant: "success" as const },
    { label: "Saldo ECOPET", value: formatMpPrice(data.wallet?.totalBalance ?? 0), icon: TrendingUp },
    { label: "Usuários", value: data.users.total, trend: `+${data.users.newThisWeek} esta semana`, icon: Users },
    { label: "Clientes ativos", value: data.users.activeClients ?? 0, icon: Users },
    { label: "Parceiros ativos", value: data.partners.active, icon: Users },
    { label: "ONGs ativas", value: data.ngos.active, icon: Users },
    { label: "Pets cadastrados", value: data.pets.total, icon: Users },
    { label: "Produtos ativos", value: data.marketplace.products, icon: ShoppingBag },
    { label: "Serviços ativos", value: data.marketplace.services, icon: ShoppingBag },
    { label: "Pedidos", value: data.marketplace.orders, icon: ShoppingBag },
    { label: "Orçamentos", value: data.marketplace.quotes ?? 0, icon: ShoppingBag },
    { label: "Aprovações pendentes", value: data.operations.pendingApprovals, icon: AlertTriangle, variant: data.operations.pendingApprovals > 0 ? "warning" as const : "default" as const },
    { label: "Tickets abertos", value: data.operations.openTickets, icon: Ticket },
    { label: "Chats abertos", value: data.operations.openChats ?? 0, icon: Ticket },
    { label: "Robôs ativos", value: data.operations.activeRobots ?? 0, icon: Sparkles },
    { label: "Engajamento", value: data.social.engagement, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <AnalyticsCards items={cards} columns={4} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AIInsightsPanel
          title="IA ECOPET — Insights automáticos"
          subtitle="Análise operacional em tempo real"
          insights={data.aiInsights.map((i) => ({
            id: i.id,
            tag: i.tag,
            title: i.title,
            description: i.description ?? "Gerado automaticamente pelo motor de inteligência ECOPET",
            priority: i.priority as "low" | "medium" | "high",
          }))}
        />
        <div className="card-premium rounded-[16px] border border-ecopet-gray/10 p-5">
          <h3 className="font-display font-bold">Operações</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ecopet-gray">Denúncias pendentes</dt><dd className="font-semibold">{data.operations.pendingReports}</dd></div>
            <div className="flex justify-between"><dt className="text-ecopet-gray">Integrações com erro</dt><dd className="font-semibold text-red-500">{data.integrations.errors ?? 0}</dd></div>
            <div className="flex justify-between"><dt className="text-ecopet-gray">Retenção semanal</dt><dd className="font-semibold">{data.social.retention ?? 0}%</dd></div>
            <div className="flex justify-between"><dt className="text-ecopet-gray">Integrações ativas</dt><dd className="font-semibold">{data.integrations.active}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
