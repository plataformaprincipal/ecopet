"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminMetricGrid } from "./ui/admin-metric-card";
import { AdminDataTable } from "./ui/admin-data-table";
import { AdminSocialModerationPanel } from "@/components/features/social/feed/admin-social-moderation-panel";
import { AdminSocialReportsPanel } from "@/components/features/social/feed/admin-social-reports-panel";
import { fetchGestorSection } from "@/lib/gestor/client-api";

export function AdminSocialPanel() {
  const [metrics, setMetrics] = useState<{ label: string; value: number }[]>([]);
  const [topHashtags, setTopHashtags] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGestorSection("social");
      setMetrics((data.metrics as { label: string; value: number }[]) ?? []);
      setTopHashtags((data.topHashtags as Record<string, unknown>[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <AdminPageHeader
        title="Social / Comunidade"
        description="Engajamento, moderação e denúncias — dados reais do banco."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Social" }]}
      />
      <div className="space-y-8 p-4 sm:p-6">
        {loading && <p className="text-sm text-muted-foreground">Carregando métricas…</p>}
        {!loading && metrics.length > 0 && (
          <AdminMetricGrid items={metrics.map((m) => ({ label: m.label, value: m.value }))} columns={4} />
        )}
        {topHashtags.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Top hashtags</h2>
            <AdminDataTable rows={topHashtags} />
          </section>
        )}
        <section aria-labelledby="social-posts-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="social-posts-heading" className="text-lg font-semibold">
              Posts recentes
            </h2>
            <Link href="/dashboard/admin/social/posts" className="text-sm text-ecopet-green hover:underline">
              Ver painel completo
            </Link>
          </div>
          <AdminSocialModerationPanel type="posts" />
        </section>
        <section aria-labelledby="social-reports-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="social-reports-heading" className="text-lg font-semibold">
              Denúncias pendentes
            </h2>
            <Link href="/dashboard/admin/social/reports" className="text-sm text-ecopet-green hover:underline">
              Ver todas
            </Link>
          </div>
          <AdminSocialReportsPanel />
        </section>
      </div>
    </>
  );
}
