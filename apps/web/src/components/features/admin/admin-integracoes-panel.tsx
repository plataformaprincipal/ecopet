"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminModulePage } from "./admin-module-page";

type IntegrationRow = {
  id: string;
  integracao: string;
  status: string;
  configurado?: boolean;
  ativo?: boolean;
};

export function AdminIntegracoesPanel() {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    const res = await fetch("/api/admin/erp/integracoes", { credentials: "include", cache: "no-store" });
    const json = await res.json();
    if (json.success) {
      const table = (json.data.tables as { id: string; rows: IntegrationRow[] }[])?.find(
        (t) => t.id === "integrations"
      );
      setRows(table?.rows ?? []);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const testConnection = async (id: string) => {
    setLoadingId(id);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/erp/integracoes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", entity: id, id }),
      });
      const json = await res.json();
      setFeedback(json.error?.message ?? json.data?.message ?? "Teste concluído.");
      await loadRows();
    } finally {
      setLoadingId(null);
    }
  };

  const toggleIntegration = async (id: string, enabled?: boolean) => {
    setLoadingId(id);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/erp/integracoes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", entity: id, id, payload: { enabled } }),
      });
      const json = await res.json();
      setFeedback(json.error?.message ?? (json.success ? "Integração atualizada." : "Erro ao atualizar."));
      await loadRows();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminModulePage moduleId="integracoes" />
      <section className="mx-4 mb-6 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60 sm:mx-6">
        <h2 className="mb-3 font-semibold">Testar e ativar integrações</h2>
        {feedback ? <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{feedback}</p> : null}
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 px-3 py-2 dark:border-white/10"
            >
              <div>
                <p className="text-sm font-medium">{row.integracao}</p>
                <p className="text-xs text-zinc-500">{row.status}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={loadingId === row.id} onClick={() => void testConnection(row.id)}>
                  Testar
                </Button>
                <Button
                  size="sm"
                  variant={row.ativo ? "secondary" : "default"}
                  disabled={loadingId === row.id || !row.configurado}
                  onClick={() => void toggleIntegration(row.id, !row.ativo)}
                >
                  {row.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
