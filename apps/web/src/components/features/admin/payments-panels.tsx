"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentRow = {
  id: string;
  orderNumber: number;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  externalId: string | null;
  createdAt: string;
};

export function AdminPaymentsPanel() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/payments", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) setPayments(data.data?.payments ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  if (!payments.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nenhum pagamento registrado. Pagamentos reais aparecerão aqui após configuração do gateway (Etapa 9B).
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Pagamentos reais</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {payments.map((p) => (
            <li key={p.id} className="rounded border p-2">
              <strong>#{p.orderNumber}</strong> · {p.provider} · {p.currency} {p.amount.toFixed(2)} · {p.status}
              <br />
              <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function AdminPaymentEventsPanel() {
  const [events, setEvents] = useState<Array<{
    id: string;
    provider: string;
    eventType: string;
    status: string;
    errorCode: string | null;
    message: string | null;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/payment-events", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) setEvents(data.data?.events ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  if (!events.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nenhum evento de pagamento registrado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Eventos de pagamento</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {events.map((e) => (
            <li key={e.id} className="rounded border p-2">
              {e.provider} · {e.eventType} · {e.status}
              {e.errorCode && <> · <span className="text-amber-700">{e.errorCode}</span></>}
              {e.message && <p className="text-muted-foreground">{e.message}</p>}
              <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
