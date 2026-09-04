"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommerceQuote } from "@/lib/messages/client-api";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CommerceQuoteCard({
  quote,
  isClient,
  busy,
  onAccept,
  onReject,
}: {
  quote: CommerceQuote;
  isClient?: boolean;
  busy?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const canDecide = isClient && (quote.status === "SENT" || quote.status === "VIEWED" || quote.status === "NEGOTIATING");
  return (
    <Card className="border-ecopet-green/30 bg-card" data-testid="commerce-quote-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{quote.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {quote.status} · válido até {new Date(quote.validUntil).toLocaleDateString("pt-BR")}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <ul className="space-y-1">
          {quote.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.quantity}× {item.description}
              </span>
              <span>{brl(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        {quote.discountAmount > 0 ? <p>Desconto: {brl(quote.discountAmount)}</p> : null}
        {quote.shippingAmount > 0 ? <p>Frete: {brl(quote.shippingAmount)}</p> : null}
        <p className="font-semibold">Total: {brl(quote.totalAmount)}</p>
        {quote.notes ? <p className="text-xs text-muted-foreground">{quote.notes}</p> : null}
        {quote.rejectionReason ? <p className="text-xs text-red-600">Motivo: {quote.rejectionReason}</p> : null}
        {canDecide ? (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" disabled={busy} onClick={onReject} data-testid="quote-reject">
              Recusar
            </Button>
            <Button size="sm" disabled={busy} onClick={onAccept} data-testid="quote-accept">
              Aceitar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
