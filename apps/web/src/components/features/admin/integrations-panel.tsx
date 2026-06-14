"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type IntegrationItem = {
  name: string;
  provider: string;
  category: string;
  status: string;
  requiredEnvVars: string[];
  configuredEnvVars: string[];
  missingEnvVars: string[];
  canRunInProduction: boolean;
  canRunInDevelopment: boolean;
  message: string;
  recommendedAction: string;
  lastCheckedAt: string;
};

type LogItem = {
  id: string;
  integrationName: string;
  provider: string;
  action: string;
  status: string;
  errorCode: string | null;
  message: string | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DEV_ONLY: "bg-blue-100 text-blue-800",
  NOT_CONFIGURED: "bg-gray-100 text-gray-700",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  ERROR: "bg-red-100 text-red-800",
  DISABLED: "bg-slate-100 text-slate-600",
};

export function AdminIntegrationsPanel() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [environment, setEnvironment] = useState("");
  const [checkedAt, setCheckedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/integrations/health", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error?.message ?? "Erro ao carregar integrações");
          return;
        }
        const health = data.data?.health;
        setIntegrations(health?.integrations ?? []);
        setLogs(health?.recentLogs ?? []);
        setEnvironment(health?.environment ?? "");
        setCheckedAt(health?.checkedAt ?? "");
      })
      .catch(() => setError("Não foi possível carregar o painel."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando status das integrações…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600" role="alert">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Ambiente: <strong>{environment}</strong> · Última checagem: {checkedAt ? new Date(checkedAt).toLocaleString("pt-BR") : "—"}
      </p>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhuma integração registrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {integrations.map((item) => (
            <Card key={item.name}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{item.provider}</CardTitle>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? "bg-gray-100"}`}>
                    {item.status}
                  </span>
                </div>
                <CardDescription>{item.name} · {item.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{item.message}</p>
                <p className="text-muted-foreground">
                  Produção: {item.canRunInProduction ? "permitido" : "bloqueado"} · Dev: {item.canRunInDevelopment ? "permitido" : "bloqueado"}
                </p>
                {item.requiredEnvVars.length > 0 && (
                  <p><strong>Variáveis necessárias:</strong> {item.requiredEnvVars.join(", ")}</p>
                )}
                {item.missingEnvVars.length > 0 && (
                  <p className="text-amber-700"><strong>Ausentes:</strong> {item.missingEnvVars.join(", ")}</p>
                )}
                {item.configuredEnvVars.length > 0 && (
                  <p className="text-green-700"><strong>Configuradas:</strong> {item.configuredEnvVars.join(", ")}</p>
                )}
                <p className="text-xs text-muted-foreground">{item.recommendedAction}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logs recentes</CardTitle>
          <CardDescription>Sem exposição de secrets — apenas status e códigos de erro.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum log registrado ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li key={log.id} className="rounded border p-2">
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="font-medium">{log.integrationName} / {log.action}</span>
                    <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-muted-foreground">{log.provider} · {log.status}{log.errorCode ? ` · ${log.errorCode}` : ""}</p>
                  {log.message && <p>{log.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/payments">Pagamentos</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/payment-events">Eventos de pagamento</Link>
        </Button>
      </div>
    </div>
  );
}
