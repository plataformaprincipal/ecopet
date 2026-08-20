"use client";

import { useEffect, useState } from "react";
import { formatBrlFromCents, quoteToDisplay } from "@/lib/pricing/display";
import { OFFICIAL_RULES } from "@/lib/pricing/official-rules";
import type { PricingQuote } from "@/lib/pricing/types";

type Props = {
  kind: "PRODUCT" | "SERVICE" | "HEALTH";
  baseAmount: number;
  sku?: string;
  clinic?: boolean;
};

export function PartnerPricingPreview({ kind, baseAmount, sku, clinic }: Props) {
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
      setQuote(null);
      return;
    }
    const ctrl = new AbortController();
    fetch("/api/partner/pricing/preview", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, baseAmount, sku }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error?.message ?? "Falha no preview");
          return;
        }
        setError("");
        setQuote(json.data.quote);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError("Falha no preview");
      });
    return () => ctrl.abort();
  }, [kind, baseAmount, sku]);

  if (!baseAmount) return null;
  const display = quote ? quoteToDisplay(quote) : null;
  const yourPrice = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(baseAmount);

  return (
    <div
      className="rounded-md border border-ecopet-green/20 bg-ecopet-green/5 p-3 text-sm"
      data-testid="partner-pricing-preview"
    >
      {clinic ? (
        <p className="mb-1 font-medium">Preço de referência EccoPet — não é tabela obrigatória.</p>
      ) : null}
      {kind === "PRODUCT" ? (
        <p>
          Taxa EccoPet: {OFFICIAL_RULES.productCommissionPercentBps / 100}% +{" "}
          {formatBrlFromCents(OFFICIAL_RULES.productFixedFeeCents)} por pedido. Reserva aplicável{" "}
          {OFFICIAL_RULES.productReserveBps / 100}% (Estimativa).
        </p>
      ) : (
        <p>
          Taxa EccoPet: {OFFICIAL_RULES.serviceCommissionPercentBps / 100}% +{" "}
          {formatBrlFromCents(OFFICIAL_RULES.serviceBookingFeeCents)} por agendamento. Reserva{" "}
          {OFFICIAL_RULES.serviceReserveBps / 100}% (Estimativa).
        </p>
      )}
      {error ? <p className="text-red-600">{error}</p> : null}
      {display ? (
        <ul className="mt-2 space-y-0.5 text-xs">
          <li>Seu preço: {yourPrice}</li>
          <li>Cliente paga: {display.customerPays}</li>
          <li>Comissão: {display.eccopetCommission}</li>
          {kind !== "PRODUCT" ? <li>Booking fee: {display.bookingFee}</li> : <li>Taxa fixa: {display.fixedFee}</li>}
          <li>Payout estimado: {display.payoutEstimate} (Estimativa, não liquidado)</li>
        </ul>
      ) : null}
    </div>
  );
}
