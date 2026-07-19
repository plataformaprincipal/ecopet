"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Role = "client" | "partner";

export function FinanceiroPanel({ role }: { role: Role }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const path = role === "client" ? "/api/client/financeiro" : "/api/partner/financeiro";
    fetch(path, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) setError(j.error?.message ?? "Erro");
        else setData(j.data);
      })
      .catch(() => setError("Falha de rede"));
  }, [role]);

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (!data) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando central financeira…
      </p>
    );
  }

  const orders = (data.orders as Array<Record<string, unknown>>) ?? [];
  const claims = (data.claims as Array<Record<string, unknown>>) ?? [];
  const disputes = (data.disputes as Array<Record<string, unknown>>) ?? [];
  const summary = data.summary as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo estimado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Bruto aprovado: R$ {Number(summary.grossApprovedEstimated ?? 0).toFixed(2)}</p>
            <p>Bloqueado em disputa: R$ {Number(summary.blockedInDisputeEstimated ?? 0).toFixed(2)}</p>
            <p>{String(summary.note ?? "")}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos e pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {orders.length === 0 ? (
            <p className="text-muted-foreground">Nenhum pedido.</p>
          ) : (
            orders.map((o) => (
              <div key={String(o.id)} className="rounded border px-3 py-2">
                <p className="font-medium">
                  #{String(o.orderNumber)} · {String(o.status)} · R${" "}
                  {Number(o.total).toFixed(2)}
                </p>
                {o.fraudHold || o.fulfillmentBlocked ? (
                  <p className="text-xs text-amber-700">
                    Em revisão / expedição bloqueada (detalhes internos omitidos).
                  </p>
                ) : null}
                {o.trackingCode ? (
                  <p className="text-xs text-muted-foreground">Rastreio: {String(o.trackingCode)}</p>
                ) : null}
                <Link
                  className="text-xs underline"
                  href={
                    role === "client"
                      ? `/dashboard/client/orders/${o.id}`
                      : `/dashboard/partner/orders/${o.id}`
                  }
                >
                  Ver pedido
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reclamações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {claims.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma.</p>
            ) : (
              claims.map((c) => (
                <p key={String(c.id)}>
                  {String(c.status)}
                  {c.reason ? ` · ${String(c.reason)}` : ""}
                </p>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contestações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {disputes.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma.</p>
            ) : (
              disputes.map((d) => (
                <p key={String(d.id)}>
                  {String(d.status)}
                  {d.amount != null ? ` · R$ ${Number(d.amount).toFixed(2)}` : ""}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {typeof data.subscriptionsNote === "string" ? (
        <p className="text-xs text-muted-foreground">{data.subscriptionsNote}</p>
      ) : null}
    </div>
  );
}
