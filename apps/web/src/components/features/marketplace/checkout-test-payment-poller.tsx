"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TERMINAL = new Set(["APPROVED", "PAID", "REJECTED", "CANCELLED", "EXPIRED", "ERROR", "REFUNDED"]);

type Props = {
  orderId: string;
  paymentId?: string | null;
};

export function CheckoutTestPaymentPoller({ orderId, paymentId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando pagamento TEST com o Mercado Pago…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 24;

    async function tick() {
      attempts += 1;
      try {
        const id = paymentId || orderId;
        const as = paymentId ? "" : "?as=order";
        const res = await fetch(`/api/checkout-test/mercado-pago/order/${id}${as}`, {
          credentials: "include",
          signal: AbortSignal.timeout(10_000),
        });
        const json = await res.json().catch(() => ({}));
        const status = String(json.data?.status ?? json.data?.order?.status ?? "");
        if (cancelled) return;
        if (TERMINAL.has(status) || json.data?.order?.status === "PAID") {
          router.refresh();
          return;
        }
        if (attempts >= maxAttempts) {
          setMessage("Ainda estamos confirmando o pagamento de teste. Atualize em instantes.");
          setFailed(true);
          return;
        }
      } catch {
        if (attempts >= maxAttempts) {
          setFailed(true);
          setMessage("Não foi possível consultar o pagamento de teste agora.");
          return;
        }
      }
      if (!cancelled) window.setTimeout(() => void tick(), 3_000);
    }

    void tick();
    return () => {
      cancelled = true;
    };
  }, [orderId, paymentId, router]);

  return (
    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground" role="status">
      {!failed ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
      <p>{message}</p>
      {failed ? (
        <button type="button" className="text-ecopet-green underline" onClick={() => router.refresh()}>
          Atualizar status
        </button>
      ) : null}
    </div>
  );
}
