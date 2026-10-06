"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TERMINAL = new Set(["APPROVED", "PAID", "REJECTED", "CANCELLED", "EXPIRED", "ERROR", "REFUNDED"]);

type Props = {
  orderId: string;
  paymentId?: string | null;
  deadlineMs?: number;
  awaitingLabel?: string;
  onApproved?: () => void;
  onDeclined?: (status: string) => void;
  onExpired?: () => void;
};

/**
 * Confirmação de pagamento vem do provedor (poll server-side).
 * Nunca marca pedido como pago no cliente.
 */
export function CheckoutPaymentPoller({
  orderId,
  paymentId,
  deadlineMs = 72_000,
  awaitingLabel = "Aguardando pagamento / Processando",
  onApproved,
  onDeclined,
  onExpired,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(awaitingLabel);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    const intervalMs = 3_000;

    async function tick() {
      try {
        const id = paymentId || orderId;
        const as = paymentId ? "" : "?as=order";
        const res = await fetch(`/api/checkout/mercado-pago/order/${id}${as}`, {
          credentials: "include",
          signal: AbortSignal.timeout(10_000),
        });
        const json = await res.json().catch(() => ({}));
        const status = String(json.data?.status ?? json.data?.order?.status ?? "").toUpperCase();
        if (cancelled) return;
        if (status === "APPROVED" || json.data?.order?.status === "PAID") {
          onApproved?.();
          router.refresh();
          return;
        }
        if (TERMINAL.has(status)) {
          onDeclined?.(status);
          router.refresh();
          return;
        }
        if (Date.now() - started >= deadlineMs) {
          setMessage("Prazo esgotado. Atualize o status — não pague de novo.");
          setFailed(true);
          onExpired?.();
          return;
        }
      } catch {
        if (Date.now() - started >= deadlineMs) {
          setFailed(true);
          setMessage("Não foi possível consultar o pagamento agora. Tente atualizar a página.");
          onExpired?.();
          return;
        }
      }
      if (!cancelled) window.setTimeout(() => void tick(), intervalMs);
    }

    void tick();
    return () => {
      cancelled = true;
    };
  }, [orderId, paymentId, router, deadlineMs, onApproved, onDeclined, onExpired]);

  return (
    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground" role="status">
      {!failed ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
      <p>{failed ? message : awaitingLabel}</p>
      {failed ? (
        <button type="button" className="text-ecopet-green underline" onClick={() => router.refresh()}>
          Atualizar status
        </button>
      ) : null}
    </div>
  );
}
