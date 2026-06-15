"use client";

import { useEffect, useState } from "react";
import { GestorHeader } from "./gestor-header";
import { ExportButton } from "./export-button";
import { fetchGestorSection } from "@/lib/gestor/client-api";

export function GestorReportsPanel() {
  const [meta, setMeta] = useState<{ types: { type: string }[] } | null>(null);

  useEffect(() => {
    fetchGestorSection("reports").then((d) => setMeta(d as { types: { type: string }[] }));
  }, []);

  return (
    <>
      <GestorHeader title="Relatórios" description="Exportação CSV sob demanda com mascaramento e AuditLog." />
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Selecione o tipo e exporte com os filtros da seção correspondente.</p>
        <div className="flex flex-wrap gap-3">
          {(meta?.types ?? []).map((t) => (
            <ExportButton key={t.type} reportType={t.type} />
          ))}
        </div>
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Integrações BI futuras (não ativas)</h2>
          <p className="text-xs text-muted-foreground">
            Metabase, PostHog, Looker Studio, webhooks e exportação agendada permanecem NOT_CONFIGURED até credenciais.
          </p>
        </section>
      </div>
    </>
  );
}
