"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";

type RefundRow = {
  id: string;
  paymentId: string;
  orderNumber: number;
  type: string;
  amount: number;
  reason: string;
  status: string;
  requestedBy: { name: string; role: string } | null;
  paymentAmount: number;
  paymentRefundedAmount: number;
  failureReason: string | null;
  requestedAt: string;
};

export function AdminFinanceiroEstornosPanel() {
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/admin/financeiro/estornos", { credentials: "include" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error?.message ?? "Falha ao carregar");
      return;
    }
    setRows(json.data.refunds);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(row: RefundRow) {
    setBusyId(row.id);
    try {
      const res = await fetch("/api/admin/financeiro/estornos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: row.paymentId,
          paymentRefundId: row.id,
          amount: row.amount,
          full: row.type === "FULL",
          reason: row.reason,
          action: "execute",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(row: RefundRow) {
    setBusyId(row.id);
    try {
      const res = await fetch("/api/admin/financeiro/estornos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: row.paymentId,
          paymentRefundId: row.id,
          reason: "Solicitação rejeitada pelo administrador",
          action: "reject",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <AdminPageHeader
        title="Estornos"
        description="Solicitações do cliente e estornos processados."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Financeiro", href: "/admin/financeiro" },
          { label: "Estornos" },
        ]}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/financeiro/pagamentos">Pagamentos</Link>
        </Button>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Pedido</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Valor</th>
                <th className="p-2">Status</th>
                <th className="p-2">Solicitante</th>
                <th className="p-2">Motivo</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">#{r.orderNumber}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">R$ {r.amount.toFixed(2)}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">
                    {r.requestedBy ? `${r.requestedBy.name} (${r.requestedBy.role})` : "—"}
                  </td>
                  <td className="p-2 max-w-xs truncate" title={r.reason}>
                    {r.reason}
                  </td>
                  <td className="p-2">
                    {r.status === "REQUESTED" || r.status === "UNDER_REVIEW" ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => void approve(r)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() => void reject(r)}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    ) : r.failureReason ? (
                      <span className="text-xs text-red-600">{r.failureReason}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum estorno registrado.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
