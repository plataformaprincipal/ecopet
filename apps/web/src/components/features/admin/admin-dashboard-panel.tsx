"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "./admin-header";
import { MetricGrid } from "@/components/features/gestor-admin/metric-card";

type Metric = { key: string; label: string; value: number };

export function AdminDashboardPanel() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/overview", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Erro ao carregar métricas");
      setMetrics(data.data.metrics);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingPartners = metrics.find((m) => m.key === "partners_pending")?.value ?? 0;
  const pendingOngs = metrics.find((m) => m.key === "ongs_pending")?.value ?? 0;

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Visão geral da plataforma — dados em tempo real do banco."
      />
      <div className="space-y-6 p-6">
        {loading && <p className="text-sm text-muted-foreground" role="status">Carregando métricas…</p>}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && metrics.length > 0 && (
          <MetricGrid items={metrics.map((m) => ({ label: m.label, value: m.value }))} columns={3} />
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/admin/approvals"
            title="Aprovações pendentes"
            description={`${pendingPartners} parceiro(s) · ${pendingOngs} ONG(s)`}
          />
          <QuickLink href="/admin/users" title="Gerenciar usuários" description="Busca, filtros e status" />
          <QuickLink href="/admin/social" title="Moderação social" description="Posts e denúncias" />
        </div>
      </div>
    </>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green dark:bg-white/5"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
