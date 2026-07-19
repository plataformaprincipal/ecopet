"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "./ui/admin-page-header";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}

type Overview = {
  configured: boolean;
  activeDevices: number;
  usersWithPush: number;
  recentDeliveries: Array<{
    id: string;
    status: string;
    errorCode: string | null;
    createdAt: string;
    sentAt: string | null;
  }>;
};

export function AdminPushNotificationsPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("CLIENT");
  const [category, setCategory] = useState("admin");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/notifications");
  const [estimate, setEstimate] = useState<{ devices: number; users: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications/push", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar.");
        return;
      }
      setData(json.data as Overview);
    } catch {
      setError("Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runEstimate() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notifications/push", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          role,
          category,
          title: title || "Estimativa",
          body: body || "Estimativa de público",
          url,
          confirm: true,
          estimateOnly: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setResult(json.error?.message ?? "Falha na estimativa.");
        return;
      }
      setEstimate(json.data.estimate);
    } finally {
      setBusy(false);
    }
  }

  async function sendBroadcast() {
    if (confirmText !== "ENVIAR") {
      setResult('Digite ENVIAR para confirmar o envio administrativo.');
      return;
    }
    if (title.trim().length < 3 || body.trim().length < 3) {
      setResult("Título e texto são obrigatórios.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notifications/push", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          role,
          category,
          title,
          body,
          url,
          confirm: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setResult(json.error?.message ?? "Falha no envio.");
        return;
      }
      const s = json.data.summary;
      setResult(
        `Concluído — attempted=${s.attempted} sent=${s.sent} failed=${s.failed} invalid=${s.invalidTokens} skipped=${s.skipped}`
      );
      setConfirmText("");
      void load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Notificações Push"
        description="Envio administrativo controlado via FCM — com confirmação, AuditLog e limite de taxa."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Notificações", href: "/admin/notificacoes" },
          { label: "Push" },
        ]}
      >
        <Button asChild variant="outline">
          <Link href="/admin/integracoes/firebase">Diagnóstico Firebase</Link>
        </Button>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !data ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      {data ? (
        <Card>
          <CardHeader>
            <CardTitle>Visão geral</CardTitle>
            <CardDescription>
              Configurado: {data.configured ? "sim" : "não"} · Dispositivos: {data.activeDevices} ·
              Usuários: {data.usersWithPush}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {data.recentDeliveries.map((d) => (
                <li key={d.id} className="flex justify-between gap-2 border-b border-border/40 py-1">
                  <span>{d.status}</span>
                  <span className="text-muted-foreground">
                    {d.errorCode || "—"} · {new Date(d.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
              {data.recentDeliveries.length === 0 ? (
                <li className="text-muted-foreground">Nenhuma entrega registrada.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Envio por papel</CardTitle>
          <CardDescription>
            Marketing exige consentimento do usuário. Não envie para &quot;todos&quot; sem necessidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="role">Público (role)</FieldLabel>
              <select
                id="role"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="CLIENT">CLIENT</option>
                <option value="PARTNER">PARTNER</option>
                <option value="ONG">ONG</option>
                <option value="ADMIN">ADMIN</option>
                <option value="TUTOR">TUTOR</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="category">Categoria</FieldLabel>
              <select
                id="category"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="admin">Administrativo</option>
                <option value="orders">Pedidos</option>
                <option value="messages">Mensagens</option>
                <option value="appointments">Agenda</option>
                <option value="social">Social</option>
                <option value="support">Suporte</option>
                <option value="marketing">Marketing</option>
                <option value="security">Segurança</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="title">Título</FieldLabel>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div>
            <FieldLabel htmlFor="body">Texto</FieldLabel>
            <Input id="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={180} />
          </div>
          <div>
            <FieldLabel htmlFor="url">Rota interna</FieldLabel>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={400} />
          </div>
          <div>
            <FieldLabel htmlFor="confirm">Confirmação (digite ENVIAR)</FieldLabel>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => void runEstimate()}>
              Estimar público
            </Button>
            <Button type="button" disabled={busy} onClick={() => void sendBroadcast()}>
              Confirmar e enviar
            </Button>
          </div>
          {estimate ? (
            <p className="text-sm" role="status">
              Estimativa: {estimate.users} usuários · {estimate.devices} dispositivos
            </p>
          ) : null}
          {result ? (
            <p className="text-sm" role="status">
              {result}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
