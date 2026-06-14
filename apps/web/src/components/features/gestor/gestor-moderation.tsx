"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchModerationReports, resolveReport, type ContentReport } from "@/lib/gestor/api";
import { GestorError, GestorLoading } from "./gestor-shell";

export function GestorModerationPanel() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetchModerationReports().then(setReports).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleResolve(id: string, action: string) {
    await resolveReport(id, action, "RESOLVED");
    load();
  }

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;

  return (
    <div className="space-y-3">
      {reports.length === 0 ? (
        <p className="text-ecopet-gray">Nenhuma denúncia pendente.</p>
      ) : reports.map((r) => (
        <article key={r.id} className="card-premium rounded-[16px] border p-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{r.targetType}</Badge>
            <Badge variant="secondary">{r.reason}</Badge>
          </div>
          <p className="mt-2 text-sm">{r.description ?? "Sem descrição"}</p>
          <p className="text-xs text-ecopet-gray">Por {r.reporter.name} · {new Date(r.createdAt).toLocaleString("pt-BR")}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => handleResolve(r.id, "hide")}>Ocultar conteúdo</Button>
            <Button size="sm" variant="outline" onClick={() => handleResolve(r.id, "dismiss")}>Dispensar</Button>
          </div>
        </article>
      ))}
    </div>
  );
}
