"use client";

import { useEffect, useState } from "react";
import { PIX_WAIT_MS } from "@/lib/checkout/payment-wait";

export { PIX_WAIT_MS };

function formatMmSs(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PaymentCountdown({
  endsAt,
  onExpire,
  expiredLabel = "Expirado",
}: {
  endsAt: number;
  onExpire?: () => void;
  expiredLabel?: string;
}) {
  const [left, setLeft] = useState(() => endsAt - Date.now());

  useEffect(() => {
    let done = false;
    const tick = () => {
      const next = endsAt - Date.now();
      setLeft(next);
      if (next <= 0 && !done) {
        done = true;
        onExpire?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt, onExpire]);

  if (left <= 0) {
    return (
      <p className="text-sm font-medium text-red-600" role="status">
        {expiredLabel}
      </p>
    );
  }

  return (
    <p className="text-sm font-semibold tabular-nums" role="timer" aria-live="polite">
      Tempo restante: {formatMmSs(left)}
    </p>
  );
}

export function BoletoDueStatus({ dueAt }: { dueAt: string | Date | null | undefined }) {
  const due = dueAt ? new Date(dueAt) : null;
  const expired = due ? due.getTime() <= Date.now() : false;
  if (!due) {
    return <p className="text-sm">Status: pendente. O vencimento será informado no boleto.</p>;
  }
  if (expired) {
    return (
      <p className="text-sm font-medium text-red-600" role="status">
        Boleto inválido/expirado. Vencimento: {due.toLocaleString("pt-BR")}
      </p>
    );
  }
  return (
    <p className="text-sm" role="status">
      Status: pendente · Vencimento: {due.toLocaleString("pt-BR")}
    </p>
  );
}
