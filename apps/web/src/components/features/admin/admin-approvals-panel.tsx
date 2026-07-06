"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminHeader } from "./admin-header";
import { AdminAlert } from "./admin-alert";

type AccountRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cnpj: string | null;
  accountStatus: string;
  createdAt: string;
  partnerProfile?: {
    businessName: string;
    cnpj: string | null;
    city: string;
    state: string;
    verificationStatus: string;
  } | null;
  ongProfile?: {
    ongName: string | null;
    name: string;
    cnpj: string;
    city: string | null;
    state: string | null;
    verificationStatus: string;
  } | null;
};

type Tab = "partners-pending" | "ongs-pending" | "rejected" | "suspended";

const TABS: { id: Tab; label: string }[] = [
  { id: "partners-pending", label: "Parceiros pendentes" },
  { id: "ongs-pending", label: "ONGs pendentes" },
  { id: "rejected", label: "Rejeitados" },
  { id: "suspended", label: "Suspensos" },
];

async function reviewAccount(userId: string, action: "approve" | "reject" | "suspend", reason?: string) {
  const res = await fetch(`/api/admin/accounts/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Falha na operação");
  return data;
}

export function AdminApprovalsPanel() {
  const [tab, setTab] = useState<Tab>("partners-pending");
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ userId: string; action: "approve" | "reject" | "suspend" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/admin/accounts";
      if (tab === "partners-pending") url = "/api/admin/accounts/partners?status=PENDING";
      else if (tab === "ongs-pending") url = "/api/admin/accounts/ongs?status=PENDING";
      else if (tab === "rejected") url = "/api/admin/accounts/partners?status=REJECTED";
      else if (tab === "suspended") url = "/api/admin/accounts/partners?status=SUSPENDED";

      if (tab === "rejected" || tab === "suspended") {
        const [partnersRes, ongsRes] = await Promise.all([
          fetch(
            tab === "rejected"
              ? "/api/admin/accounts/partners?status=REJECTED"
              : "/api/admin/accounts/partners?status=SUSPENDED",
            { credentials: "include" }
          ),
          fetch(
            tab === "rejected"
              ? "/api/admin/accounts/ongs?status=REJECTED"
              : "/api/admin/accounts/ongs?status=SUSPENDED",
            { credentials: "include" }
          ),
        ]);
        const partnersData = await partnersRes.json();
        const ongsData = await ongsRes.json();
        if (!partnersData.success || !ongsData.success) throw new Error("Erro ao carregar contas");
        setRows([...(partnersData.data.partners ?? []), ...(ongsData.data.ongs ?? [])]);
        return;
      }

      if (tab === "ongs-pending") {
        const res = await fetch("/api/admin/accounts/ongs?status=PENDING", { credentials: "include" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);
        setRows(data.data.ongs ?? []);
        return;
      }

      if (tab === "partners-pending") {
        const res = await fetch("/api/admin/accounts/partners?status=PENDING", { credentials: "include" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message);
        setRows(data.data.partners ?? []);
        return;
      }

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setRows([...(data.data.partners ?? []), ...(data.data.ongs ?? [])]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function executeAction(userId: string, action: "approve" | "reject" | "suspend") {
    if (action === "reject" && !reasonById[userId]?.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }
    setBusyId(userId);
    setError("");
    setSuccess("");
    try {
      await reviewAccount(userId, action, reasonById[userId]);
      setSuccess(
        action === "approve"
          ? "Conta aprovada com sucesso."
          : action === "reject"
            ? "Conta rejeitada."
            : "Conta suspensa."
      );
      setConfirm(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminHeader
        title="Aprovações"
        description="Revise parceiros e ONGs pendentes, rejeitados ou suspensos."
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtros de aprovação">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green ${
                tab === t.id ? "bg-ecopet-green text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess("")} />}
        {error && <AdminAlert type="error" message={error} onDismiss={() => setError("")} />}

        {loading && <p className="text-sm text-muted-foreground" role="status">Carregando…</p>}

        {!loading && rows.length === 0 && (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Nenhuma conta nesta categoria.
          </p>
        )}

        <ul className="space-y-4">
          {rows.map((row) => {
            const isPartner = Boolean(row.partnerProfile);
            const displayName = isPartner
              ? row.partnerProfile!.businessName
              : row.ongProfile?.ongName ?? row.ongProfile?.name ?? row.name;
            const doc = isPartner ? row.partnerProfile?.cnpj ?? row.cnpj : row.ongProfile?.cnpj ?? row.cnpj;
            const city = isPartner ? row.partnerProfile?.city : row.ongProfile?.city;
            const state = isPartner ? row.partnerProfile?.state : row.ongProfile?.state;
            const status = row.accountStatus;

            return (
              <li key={row.id} className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPartner ? "Parceiro" : "ONG"} · {doc ?? "—"} · {row.phone ?? "—"} · {city}/{state}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cadastro: {new Date(row.createdAt).toLocaleDateString("pt-BR")} · Status: {status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === row.id}
                      onClick={() => setConfirm({ userId: row.id, action: "approve" })}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === row.id}
                      onClick={() => setConfirm({ userId: row.id, action: "reject" })}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === row.id}
                      onClick={() => setConfirm({ userId: row.id, action: "suspend" })}
                    >
                      Suspender
                    </Button>
                  </div>
                </div>
                {(tab.includes("pending") || tab === "rejected") && (
                  <div className="mt-3">
                    <label htmlFor={`reason-${row.id}`} className="sr-only">
                      Motivo da rejeição ou suspensão
                    </label>
                    <Input
                      id={`reason-${row.id}`}
                      placeholder="Motivo (obrigatório para rejeição)"
                      value={reasonById[row.id] ?? ""}
                      onChange={(e) => setReasonById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {confirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-950">
              <h2 id="confirm-title" className="font-semibold">
                Confirmar ação
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {confirm.action === "approve" && "Deseja aprovar esta conta?"}
                {confirm.action === "reject" && "Deseja rejeitar esta conta? O motivo será enviado ao usuário."}
                {confirm.action === "suspend" && "Deseja suspender esta conta?"}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirm(null)}>
                  Cancelar
                </Button>
                <Button
                  variant={confirm.action === "approve" ? "default" : "destructive"}
                  disabled={busyId === confirm.userId}
                  onClick={() => void executeAction(confirm.userId, confirm.action)}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
