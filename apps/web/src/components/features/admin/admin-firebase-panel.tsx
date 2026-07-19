"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import { getOrCreateDeviceId } from "@/lib/firebase/messaging-client";
import { usePushNotifications } from "@/hooks/use-push-notifications";

type FirebaseDiag = {
  provider: string;
  version: string;
  status: {
    configured: boolean;
    projectIdConfigured: boolean;
    clientEmailConfigured: boolean;
    privateKeyConfigured: boolean;
    vapidConfigured: boolean;
    publicConfigConfigured: boolean;
    projectIdMasked: string | null;
    environment: string;
    status: string;
    sanitizedMessage?: string;
  };
  clientReady: boolean;
  adminConfigured: boolean;
  serviceWorkerPath: string;
  serviceWorkerReachable: boolean | null;
  metrics: {
    activeDevices: number;
    usersWithPush: number;
    totalDeliveries: number;
    sent: number;
    failed: number;
    invalidTokens: number;
    retries: number;
    lastSentAt: string | null;
    lastErrorAt: string | null;
    lastErrorCode: string | null;
    errorsByCode: Array<{ code: string; count: number }>;
  };
  notes: string[];
};

export function AdminFirebasePanel() {
  const [data, setData] = useState<FirebaseDiag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const push = usePushNotifications();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations/firebase/diagnostics", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar diagnóstico.");
        return;
      }
      setData(json.data as FirebaseDiag);
    } catch {
      setError("Não foi possível carregar o diagnóstico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendTest() {
    setTestBusy(true);
    setTestMsg(null);
    try {
      if (!push.serverActive && push.state !== "TOKEN_REGISTERED") {
        const enabled = await push.enable();
        if (!enabled.ok) {
          setTestMsg("Ative as notificações neste navegador antes do teste.");
          return;
        }
      }
      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/admin/notifications/push", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", deviceId }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setTestMsg(json.error?.message ?? "Falha no envio de teste.");
        return;
      }
      const s = json.data?.summary;
      setTestMsg(
        s?.sent > 0
          ? "Notificação de teste enviada para este dispositivo."
          : `Envio sem entrega: sent=${s?.sent ?? 0}, failed=${s?.failed ?? 0}, invalid=${s?.invalidTokens ?? 0}`
      );
      void load();
    } catch {
      setTestMsg("Erro ao enviar teste.");
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Firebase Cloud Messaging"
        description="Push web via FCM HTTP v1 — diagnóstico sanitizado, sem tokens ou chaves privadas."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Integrações", href: "/admin/integracoes" },
          { label: "Firebase" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/notificacoes/push">Painel Push</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes">Voltar</Link>
          </Button>
        </div>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !data ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      {data ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Status da integração</CardTitle>
                <CardDescription>{data.status.sanitizedMessage}</CardDescription>
              </div>
              <AdminStatusBadge status={data.status.status} />
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p>Admin SDK: {data.adminConfigured ? "configurado" : "pendente"}</p>
              <p>Cliente Web: {data.clientReady ? "pronto" : "pendente"}</p>
              <p>VAPID pública: {data.status.vapidConfigured ? "sim" : "não"}</p>
              <p>Project ID: {data.status.projectIdMasked ?? "—"}</p>
              <p>Ambiente: {data.status.environment}</p>
              <p>
                Service Worker ({data.serviceWorkerPath}):{" "}
                {data.serviceWorkerReachable == null
                  ? "não verificado"
                  : data.serviceWorkerReachable
                    ? "acessível"
                    : "indisponível"}
              </p>
              <p>Private key: {data.status.privateKeyConfigured ? "presente" : "ausente"}</p>
              <p>Client email: {data.status.clientEmailConfigured ? "presente" : "ausente"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas</CardTitle>
              <CardDescription>Entregas aceitas pelo FCM — sem confirmação de leitura no dispositivo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
              <p>Dispositivos ativos: {data.metrics.activeDevices}</p>
              <p>Usuários com push: {data.metrics.usersWithPush}</p>
              <p>Envios (SENT): {data.metrics.sent}</p>
              <p>Falhas: {data.metrics.failed}</p>
              <p>Tokens inválidos: {data.metrics.invalidTokens}</p>
              <p>Retries pendentes: {data.metrics.retries}</p>
              <p>Último envio: {data.metrics.lastSentAt ? new Date(data.metrics.lastSentAt).toLocaleString() : "—"}</p>
              <p>Último erro: {data.metrics.lastErrorCode ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teste neste dispositivo</CardTitle>
              <CardDescription>
                Ativa push no navegador do admin e envia somente para este deviceId — sem colar token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={push.busy} onClick={() => void push.enable()}>
                  Ativar push aqui
                </Button>
                <Button type="button" disabled={testBusy} onClick={() => void sendTest()}>
                  {testBusy ? "Enviando…" : "Enviar notificação de teste para este dispositivo"}
                </Button>
              </div>
              {testMsg ? (
                <p className="text-sm" role="status">
                  {testMsg}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {data.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
