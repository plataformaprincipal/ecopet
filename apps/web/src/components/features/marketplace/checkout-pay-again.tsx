"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MercadoPagoCheckout } from "@/components/features/marketplace/mercado-pago-checkout";

export function CheckoutPayAgain(props: {
  orderId: string;
  amount: number;
  payerEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-sm text-green-700" role="status">
        Pagamento atualizado. Atualize a página se o status ainda não refletir.
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Pagar / tentar novamente
      </Button>
    );
  }

  return (
    <div className="text-left">
      <MercadoPagoCheckout
        orderId={props.orderId}
        amount={props.amount}
        payerEmail={props.payerEmail}
        onPaid={() => setDone(true)}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
