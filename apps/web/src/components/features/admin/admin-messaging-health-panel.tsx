"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "@/components/features/admin/ui/admin-status-badge";

type HealthPayload = {
  health: {
    configured: boolean;
    environment: string;
    publicAppIdPresent: boolean;
    publicAppIdPreview: string | null;
    secretConfigured: boolean;
    webhookSecretConfigured: boolean;
    signatureGenerationOk: boolean;
    webhookReady: boolean;
    talkjsLinkedConversations: number;
    webhooksByStatus: Record<string, number>;
    flags: Record<string, boolean>;
  };
};

export function AdminMessagingHealthPanel() {
  const [data, setData] = useState<HealthPayload["health"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messaging/health", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar.");
        return;
      }
      setData((json.data as HealthPayload).health);
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Mensagens / TalkJS</h2>
          <p className="text-sm text-muted-foreground">
            Health sanitizado — sem secrets. Ambiente: {data?.environment ?? "…"}.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
              <CardDescription>App ID preview: {data.publicAppIdPreview ?? "—"}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <AdminStatusBadge status={data.configured ? "CONFIGURED" : "NOT_CONFIGURED"} />
              <AdminStatusBadge status={data.secretConfigured ? "SECRET_OK" : "SECRET_MISSING"} />
              <AdminStatusBadge
                status={data.webhookSecretConfigured ? "WEBHOOK_SECRET_OK" : "WEBHOOK_SECRET_PENDING"}
              />
              <AdminStatusBadge status={data.signatureGenerationOk ? "SIGNATURE_OK" : "SIGNATURE_FAIL"} />
              <AdminStatusBadge status={data.webhookReady ? "WEBHOOK_READY" : "WEBHOOK_NOT_READY"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métricas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Conversas vinculadas TalkJS: {data.talkjsLinkedConversations}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.webhooksByStatus).map(([status, count]) => (
                  <AdminStatusBadge key={status} status={`${status}:${count}`} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature flags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(data.flags).map(([k, v]) => (
                <AdminStatusBadge key={k} status={`${k}:${v ? "ON" : "OFF"}`} />
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
