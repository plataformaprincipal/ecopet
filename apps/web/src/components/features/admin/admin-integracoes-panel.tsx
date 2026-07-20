"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import { AdminModulePage } from "./admin-module-page";

/** TODO(i18n): wire to admin.integrations.* keys in pt-BR / en / es */

type IntegrationStatusItem = {
  provider: string;
  displayName: string;
  configured: boolean;
  available: boolean;
  status: string;
  missingVariables: string[];
  lastCheckedAt?: string;
  sanitizedError?: string;
  capabilities: string[];
};

type SmokeFeedback = {
  provider: string;
  ok: boolean;
  code: string;
  message?: string;
};

const TEST_ENDPOINT: Record<string, { path: string; body?: Record<string, string> }> = {
  openai: { path: "/api/admin/integrations/openai/test" },
  resend: { path: "/api/admin/integrations/resend/test" },
  twilio: { path: "/api/admin/integrations/twilio/test" },
  talkjs: { path: "/api/admin/integrations/talkjs/test" },
  cloudinary: { path: "/api/admin/integrations/cloudinary/test" },
  mercado_pago: {
    path: "/api/admin/integrations/payment/test",
    body: { provider: "mercado_pago" },
  },
  stripe: {
    path: "/api/admin/integrations/payment/test",
    body: { provider: "stripe" },
  },
};

const PHASE3_ORDER = [
  "openai",
  "resend",
  "twilio",
  "talkjs",
  "cloudinary",
  "mercado_pago",
  "stripe",
  "push",
  "supabase",
] as const;

type ErpRow = {
  id: string;
  integracao: string;
  status: string;
  configurado?: boolean;
  ativo?: boolean;
};

function formatCheckedAt(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export function AdminIntegracoesPanel() {
  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SmokeFeedback | null>(null);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailBusy, setTestEmailBusy] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<string | null>(null);

  const [erpRows, setErpRows] = useState<ErpRow[]>([]);
  const [erpFeedback, setErpFeedback] = useState<string | null>(null);
  const [erpLoadingId, setErpLoadingId] = useState<string | null>(null);

  type MpDiag = {
    status: string;
    environment: string;
    testMode: boolean;
    api: string;
    publicKeyConfigured: boolean;
    accessTokenConfigured: boolean;
    webhookSecretConfigured: boolean;
    webhookPath: string;
    webhookFutureUrl: string;
    sanitizedMessage?: string;
    counts: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      cancelled: number;
      refunded: number;
    };
    lastWebhook?: {
      eventType: string;
      status: string;
      receivedAt: string;
      failureReason?: string | null;
    } | null;
    lastSuccessAt?: string | null;
    lastErrorSanitized?: string | null;
    latencyMs?: number | null;
    errorRate?: number | null;
    probe?: { ok: boolean; code: string; message: string; charged: false };
  };
  const [mpDiag, setMpDiag] = useState<MpDiag | null>(null);
  const [mpDiagBusy, setMpDiagBusy] = useState(false);

  const loadStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations/status", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Erro ao carregar status das integrações.");
        return;
      }
      const list = (json.data?.integrations ?? []) as IntegrationStatusItem[];
      const byId = new Map(list.map((i) => [i.provider, i]));
      const ordered = PHASE3_ORDER.map(
        (id) =>
          byId.get(id) ?? {
            provider: id,
            displayName: id,
            configured: false,
            available: false,
            status: "NOT_CONFIGURED",
            missingVariables: [],
            capabilities: [],
          }
      );
      setIntegrations(ordered);
    } catch {
      setError("Não foi possível carregar o painel de integrações.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadErpRows = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/erp/integracoes", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        const table = (json.data.tables as { id: string; rows: ErpRow[] }[])?.find(
          (t) => t.id === "integrations"
        );
        setErpRows(table?.rows ?? []);
      }
    } catch {
      /* ERP legado opcional */
    }
  }, []);

  const loadMpDiagnostics = useCallback(async (probe = false) => {
    setMpDiagBusy(true);
    try {
      const res = await fetch(
        `/api/admin/integrations/mercado-pago/diagnostics${probe ? "?probe=1" : ""}`,
        { credentials: "include", cache: "no-store" }
      );
      const json = await res.json();
      if (res.ok && json.success) setMpDiag(json.data as MpDiag);
    } catch {
      /* ignore */
    } finally {
      setMpDiagBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadStatuses();
    void loadErpRows();
    void loadMpDiagnostics(false);
  }, [loadStatuses, loadErpRows, loadMpDiagnostics]);

  const sendResendTestEmail = async () => {
    setTestEmailBusy(true);
    setTestEmailMsg(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setTestEmailMsg(json.error?.message ?? "Falha ao enviar e-mail de teste.");
        return;
      }
      setTestEmailMsg(
        `E-mail de teste enviado${json.data?.to ? ` para ${json.data.to}` : ""}.${
          json.data?.domainNote ? ` ${json.data.domainNote}` : ""
        }`
      );
      await loadStatuses();
    } catch {
      setTestEmailMsg("Falha de rede ao enviar e-mail de teste.");
    } finally {
      setTestEmailBusy(false);
    }
  };

  const runSmokeTest = async (provider: string) => {
    const endpoint = TEST_ENDPOINT[provider];
    if (!endpoint) return;

    setTestingId(provider);
    setFeedback(null);
    try {
      const res = await fetch(endpoint.path, {
        method: "POST",
        credentials: "include",
        ...(endpoint.body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(endpoint.body),
            }
          : {}),
      });
      const json = await res.json();
      const data = json.data ?? json;
      const result = data?.results?.[0] ?? data;
      setFeedback({
        provider,
        ok: Boolean(result?.ok),
        code: result?.code ?? (json.success ? "OK" : "ERROR"),
        message: result?.message ?? json.error?.message,
      });
      await loadStatuses();
    } catch {
      setFeedback({
        provider,
        ok: false,
        code: "SMOKE_FAILED",
        message: "Falha de rede ao executar o teste.",
      });
    } finally {
      setTestingId(null);
    }
  };

  const testErpConnection = async (id: string) => {
    setErpLoadingId(id);
    setErpFeedback(null);
    try {
      const res = await fetch("/api/admin/erp/integracoes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", entity: id, id }),
      });
      const json = await res.json();
      setErpFeedback(json.error?.message ?? json.data?.message ?? "Teste concluído.");
      await loadErpRows();
    } finally {
      setErpLoadingId(null);
    }
  };

  const toggleErpIntegration = async (id: string, enabled?: boolean) => {
    setErpLoadingId(id);
    setErpFeedback(null);
    try {
      const res = await fetch("/api/admin/erp/integracoes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", entity: id, id, payload: { enabled } }),
      });
      const json = await res.json();
      setErpFeedback(
        json.error?.message ?? (json.success ? "Integração atualizada." : "Erro ao atualizar.")
      );
      await loadErpRows();
    } finally {
      setErpLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Integrações"
        description="Status dos provedores externos (Phase 3). Secrets nunca são exibidos."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Integrações" }]}
      >
        <Button variant="outline" size="sm" onClick={() => void loadStatuses()} disabled={loading}>
          Atualizar
        </Button>
      </AdminPageHeader>

      <div className="space-y-4 px-4 pb-6 sm:px-6">
        {loading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando status das integrações…
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {feedback ? (
          <p
            className={`text-sm ${feedback.ok ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}
            role="status"
          >
            [{feedback.provider}] {feedback.code}
            {feedback.message ? ` — ${feedback.message}` : ""}
          </p>
        ) : null}

        <Card className="border-zinc-200/80 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Diagnósticos avançados</CardTitle>
            <CardDescription>
              Painéis sanitizados — Turnstile, Firebase, Google Maps, Analytics e Tag Manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/integracoes/turnstile">Turnstile</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/integracoes/firebase">Firebase / FCM</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/integracoes/google-maps">Google Maps</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/integracoes/google-analytics">Google Analytics 4</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/integracoes/google-tag-manager">Google Tag Manager</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {integrations.map((item) => {
            const canTest = Boolean(TEST_ENDPOINT[item.provider]) && item.configured;
            return (
              <Card key={item.provider} className="border-zinc-200/80 dark:border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{item.displayName}</CardTitle>
                      <CardDescription className="font-mono text-xs">{item.provider}</CardDescription>
                    </div>
                    <AdminStatusBadge status={item.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Última checagem</p>
                    <p>{formatCheckedAt(item.lastCheckedAt)}</p>
                  </div>

                  {item.missingVariables.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        Variáveis ausentes
                      </p>
                      <ul className="mt-1 list-inside list-disc font-mono text-xs text-amber-800 dark:text-amber-300">
                        {item.missingVariables.map((v) => (
                          <li key={v}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma variável obrigatória ausente.</p>
                  )}

                  {item.capabilities.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Capabilities</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {item.sanitizedError ? (
                    <p className="text-xs text-muted-foreground">{item.sanitizedError}</p>
                  ) : null}

                  {canTest ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={testingId === item.provider}
                      onClick={() => void runSmokeTest(item.provider)}
                    >
                      {testingId === item.provider ? "Testando…" : "Testar config"}
                    </Button>
                  ) : null}

                  {item.provider === "turnstile" ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/10">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/integracoes/turnstile">Abrir diagnóstico Turnstile</Link>
                      </Button>
                    </div>
                  ) : null}

                  {item.provider === "push" ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/10">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/integracoes/firebase">Diagnóstico Firebase / FCM</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/notificacoes/push">Painel Push</Link>
                      </Button>
                    </div>
                  ) : null}

                  {item.provider === "google_maps" ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/10">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/integracoes/google-maps">Diagnóstico Google Maps</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/localizacoes">Localizações</Link>
                      </Button>
                    </div>
                  ) : null}

                  {item.provider === "google_analytics" ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/10">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/integracoes/google-analytics">
                          Diagnóstico Google Analytics 4
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/integracoes/google-tag-manager">
                          Diagnóstico Google Tag Manager
                        </Link>
                      </Button>
                    </div>
                  ) : null}

                  {item.provider === "mercado_pago" ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/10">
                      <p className="text-xs font-medium text-muted-foreground">
                        Diagnóstico API Orders (sem cobrança)
                      </p>
                      {mpDiag ? (
                        <ul className="space-y-1 text-[11px] text-muted-foreground">
                          <li>
                            Ambiente: {mpDiag.environment} · API: {mpDiag.api} ·{" "}
                            {mpDiag.testMode ? "TEST" : "LIVE"}
                          </li>
                          <li>
                            Public Key: {mpDiag.publicKeyConfigured ? "sim" : "não"} · Access Token:{" "}
                            {mpDiag.accessTokenConfigured ? "sim" : "não"} · Webhook secret:{" "}
                            {mpDiag.webhookSecretConfigured ? "sim" : "pendente"}
                          </li>
                          <li>
                            Pagamentos: {mpDiag.counts.total} · aprovados {mpDiag.counts.approved} ·
                            pendentes {mpDiag.counts.pending} · rejeitados {mpDiag.counts.rejected} ·
                            cancelados {mpDiag.counts.cancelled} · estornos {mpDiag.counts.refunded}
                          </li>
                          <li>
                            Último webhook:{" "}
                            {mpDiag.lastWebhook
                              ? `${mpDiag.lastWebhook.eventType} (${mpDiag.lastWebhook.status})`
                              : "nenhum"}
                          </li>
                          <li>Último sucesso: {mpDiag.lastSuccessAt ?? "—"}</li>
                          <li>Último erro: {mpDiag.lastErrorSanitized ?? "—"}</li>
                          {mpDiag.latencyMs != null ? <li>Latência probe: {mpDiag.latencyMs}ms</li> : null}
                          {mpDiag.probe ? (
                            <li>
                              Probe: {mpDiag.probe.code} — {mpDiag.probe.message}
                            </li>
                          ) : null}
                          <li className="font-mono">Webhook: {mpDiag.webhookFutureUrl}</li>
                          {mpDiag.sanitizedMessage ? <li>{mpDiag.sanitizedMessage}</li> : null}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Carregue o diagnóstico.</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={mpDiagBusy}
                          onClick={() => void loadMpDiagnostics(false)}
                        >
                          {mpDiagBusy ? "…" : "Atualizar diag."}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={mpDiagBusy || !item.configured}
                          onClick={() => void loadMpDiagnostics(true)}
                        >
                          Probe API (sem cobrança)
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {item.provider === "resend" && item.configured ? (
                    <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/10">
                      <p className="text-xs font-medium text-muted-foreground">
                        Enviar e-mail de teste (ADMIN)
                      </p>
                      <input
                        type="email"
                        value={testEmailTo}
                        onChange={(e) => setTestEmailTo(e.target.value)}
                        placeholder="destinatario@exemplo.com"
                        className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-xs dark:border-white/10"
                        aria-label="Destinatário do e-mail de teste"
                      />
                      <Button
                        size="sm"
                        disabled={testEmailBusy || !testEmailTo.trim()}
                        onClick={() => void sendResendTestEmail()}
                      >
                        {testEmailBusy ? "Enviando…" : "Enviar teste"}
                      </Button>
                      {testEmailMsg ? (
                        <p className="text-xs text-muted-foreground" role="status">
                          {testEmailMsg}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground">
                        A chave Resend nunca é exibida. Status: {item.status}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ERP legado — mantido para não quebrar fluxos existentes */}
      <div className="space-y-4 border-t border-zinc-200/80 pt-4 dark:border-white/10">
        <AdminModulePage moduleId="integracoes" />
        <section className="mx-4 mb-6 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60 sm:mx-6">
          <h2 className="mb-3 font-semibold">ERP — testar e ativar integrações</h2>
          {erpFeedback ? (
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{erpFeedback}</p>
          ) : null}
          <div className="space-y-2">
            {erpRows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 px-3 py-2 dark:border-white/10"
              >
                <div>
                  <p className="text-sm font-medium">{row.integracao}</p>
                  <p className="text-xs text-zinc-500">{row.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={erpLoadingId === row.id}
                    onClick={() => void testErpConnection(row.id)}
                  >
                    Testar
                  </Button>
                  <Button
                    size="sm"
                    variant={row.ativo ? "secondary" : "default"}
                    disabled={erpLoadingId === row.id || !row.configurado}
                    onClick={() => void toggleErpIntegration(row.id, !row.ativo)}
                  >
                    {row.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
            {erpRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma integração ERP listada.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
