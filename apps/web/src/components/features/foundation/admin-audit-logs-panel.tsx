"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminAuditLogsPanel() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit-logs?module=admin.accounts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) setError(d.error?.message ?? "Erro");
        else setLogs(d.data.logs);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando histórico...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <Button asChild variant="outline"><Link href="/dashboard/admin">Voltar</Link></Button>
      {logs.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum registro de auditoria encontrado.
        </p>
      ) : (
        logs.map((log) => (
          <Card key={String(log.id)}>
            <CardHeader><CardTitle className="text-base">{String(log.action)}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Data: {new Date(String(log.createdAt)).toLocaleString("pt-BR")}</p>
              <p>Recurso: {String(log.resource)} {log.resourceId ? `(${String(log.resourceId)})` : ""}</p>
              {log.observation ? <p>Motivo: {String(log.observation)}</p> : null}
              {(log.actor as { name?: string })?.name ? (
                <p>Admin: {(log.actor as { name: string }).name}</p>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
