"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminAlert } from "./admin-alert";
import { AdminEmptyState } from "./ui/admin-empty-state";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminErpModulePanel } from "./admin-erp-module-panel";
import { getAdminModule } from "@/lib/admin/module-config";

type AccountRow = {
  id: string;
  nome: string;
  email: string;
  role: string;
  status: string;
  motivo: string;
  advertencias: number;
  criadoEm: string;
};

type AccountDetail = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    accountStatus: string;
    accountStatusReason: string | null;
    createdAt: string;
  };
  warnings: Array<{ id: string; type: string; severity: string; reason: string; status: string; createdAt: string }>;
  counts: { pets: number; orders: number; posts: number; comments: number; reports: number; tickets: number };
  sessions: Array<{ id: string; device: string | null; ip: string | null; lastSeenAt: string | null }>;
  logins: Array<{ id: string; success: boolean; ip: string | null; createdAt: string }>;
};

const ACTIONS = [
  { id: "warn", label: "Advertir", destructive: false },
  { id: "suspend", label: "Suspender", destructive: false },
  { id: "reactivate", label: "Reativar", destructive: false },
  { id: "temp_block", label: "Bloqueio temporário", destructive: false },
  { id: "permanent_block", label: "Bloqueio definitivo", destructive: true },
  { id: "deactivate", label: "Desativar conta", destructive: true },
  { id: "anonymize", label: "Anonimizar", destructive: true },
  { id: "force_logout", label: "Forçar logout", destructive: false },
] as const;

export function AdminContasPanel() {
  const config = getAdminModule("contas")!;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [action, setAction] = useState<string>("warn");
  const [reason, setReason] = useState("");
  const [warningType, setWarningType] = useState("media");
  const [severity, setSeverity] = useState("medium");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDetail = useCallback(async (userId: string) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/governance/accounts/${userId}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Erro ao carregar conta");
      setDetail(data.data as AccountDetail);
    } catch (e) {
      setError((e as Error).message);
      setDetail(null);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const selectedAction = ACTIONS.find((a) => a.id === action);
  const needsConfirm = selectedAction?.destructive ?? false;

  async function runAction() {
    if (!selectedId || !reason.trim()) {
      setError("Informe o motivo da ação.");
      return;
    }
    if (needsConfirm && confirmText !== "CONFIRMAR") {
      setError('Digite CONFIRMAR para ações destrutivas.');
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/governance/accounts/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          reason: reason.trim(),
          warningType,
          severity,
          confirmed: needsConfirm ? true : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Falha na ação");
      setSuccess("Ação registrada com sucesso.");
      setReason("");
      setConfirmText("");
      await loadDetail(selectedId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Gestão de Contas"
        description="Advertências, suspensões, bloqueios, sessões e histórico — todas as ações geram AuditLog."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Contas" }]}
      />
      <div className="grid gap-6 p-4 lg:grid-cols-3 sm:p-6">
        <div className="lg:col-span-2 space-y-4">
          <AdminErpModulePanel config={config} />
        </div>
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Ações na conta</h3>
          {!selectedId && (
            <AdminEmptyState
              title="Selecione uma conta"
              description="Clique em um ID na tabela (via busca abaixo) ou informe o ID do usuário."
            />
          )}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">ID do usuário</label>
            <Input
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value.trim() || null)}
              placeholder="cuid do usuário"
            />
          </div>
          {error && <AdminAlert type="error" message={error} />}
          {success && <AdminAlert type="success" message={success} />}
          {detail && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{detail.user.name}</p>
                <p className="text-muted-foreground">{detail.user.email}</p>
                <AdminStatusBadge status={detail.user.accountStatus} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span>Pets: {detail.counts.pets}</span>
                <span>Pedidos: {detail.counts.orders}</span>
                <span>Posts: {detail.counts.posts}</span>
                <span>Tickets: {detail.counts.tickets}</span>
              </div>
              {detail.warnings.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Advertências</p>
                  <ul className="space-y-1 max-h-32 overflow-auto">
                    {detail.warnings.map((w) => (
                      <li key={w.id} className="rounded border p-2 text-xs">
                        {w.type} — {w.reason} ({w.status})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {detail.sessions.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Sessões ativas ({detail.sessions.length})</p>
                </div>
              )}
            </div>
          )}
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
                {a.destructive ? " ⚠" : ""}
              </option>
            ))}
          </select>
          {action === "warn" && (
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-md border px-2 py-1 text-sm"
                value={warningType}
                onChange={(e) => setWarningType(e.target.value)}
              >
                <option value="leve">Leve</option>
                <option value="media">Média</option>
                <option value="grave">Grave</option>
              </select>
              <select
                className="flex-1 rounded-md border px-2 py-1 text-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          )}
          <textarea
            className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Motivo obrigatório"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {needsConfirm && (
            <Input
              placeholder='Digite CONFIRMAR'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          )}
          <Button className="w-full" disabled={busy} onClick={() => void runAction()}>
            {busy ? "Processando…" : "Executar ação"}
          </Button>
        </div>
      </div>
    </>
  );
}
