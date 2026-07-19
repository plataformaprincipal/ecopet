"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";

type PaymentRow = {
  id: string;
  orderId: string;
  orderNumber: number;
  clientName: string;
  partnerName: string | null;
  paymentMethod: string | null;
  amount: number;
  refundedAmount: number;
  refundableBalance: number;
  status: string;
  environment: string;
  providerPaymentIdMasked: string | null;
  createdAt: string;
};

export function AdminFinanceiroPagamentosPanel() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundFull, setRefundFull] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/financeiro/pagamentos?${params}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha");
      setRows(json.data.payments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function executeRefund() {
    if (!refundPaymentId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/financeiro/estornos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: refundPaymentId,
          full: refundFull,
          amount: refundFull ? undefined : Number(refundAmount),
          reason: refundReason,
          action: "execute",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha no estorno");
      setRefundPaymentId(null);
      setRefundReason("");
      setRefundAmount("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no estorno");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <AdminPageHeader
        title="Pagamentos"
        description="Pagamentos Mercado Pago — estorno total/parcial com consulta oficial."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Financeiro", href: "/admin/financeiro" },
          { label: "Pagamentos" },
        ]}
      >
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/financeiro/estornos">Estornos</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/financeiro/conciliacao">Conciliação</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/mercado-pago/eventos">Hub MP</Link>
          </Button>
        </div>
      </AdminPageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar ID / pedido / referência"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <select
            className="rounded border px-2 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
          >
            <option value="">Todos</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
            <option value="PARTIALLY_REFUNDED">PARTIALLY_REFUNDED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <Button type="button" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-2">Pedido</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Método</th>
              <th className="p-2">Status</th>
              <th className="p-2">Valor</th>
              <th className="p-2">Reembolsável</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">#{r.orderNumber}</td>
                <td className="p-2">{r.clientName}</td>
                <td className="p-2">{r.paymentMethod ?? "—"}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">R$ {r.amount.toFixed(2)}</td>
                <td className="p-2">R$ {r.refundableBalance.toFixed(2)}</td>
                <td className="p-2">
                  {r.refundableBalance > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRefundPaymentId(r.id);
                        setRefundFull(true);
                        setRefundAmount(String(r.refundableBalance));
                      }}
                    >
                      Estornar
                    </Button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhum pagamento.</p>
        ) : null}
      </div>

      {refundPaymentId ? (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base">Confirmar estorno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={refundFull}
                onChange={(e) => setRefundFull(e.target.checked)}
              />
              Estorno total do saldo
            </label>
            {!refundFull ? (
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                aria-label="Valor parcial"
              />
            ) : null}
            <Input
              placeholder="Motivo obrigatório"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Estoque não é devolvido automaticamente. O prazo de crédito depende do meio e do banco.
            </p>
            <div className="flex gap-2">
              <Button type="button" disabled={busy || refundReason.length < 5} onClick={() => void executeRefund()}>
                Confirmar estorno
              </Button>
              <Button type="button" variant="ghost" onClick={() => setRefundPaymentId(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
