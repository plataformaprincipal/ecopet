import type { CatalogItem, PricingQuote } from "./types";

export function centsToBrl(cents: number): number {
  return cents / 100;
}

export function formatBrlFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centsToBrl(cents));
}

export type CustomerPriceCopy = {
  label: "Preço" | "A partir de" | "Referência" | "Solicitar orçamento";
  amountCents: number | null;
  hint?: string;
};

export function customerPriceCopy(params: {
  kind: "product" | "service" | "health";
  sellerPriceCents?: number | null;
  providerPriceCents?: number | null;
  priceOnRequest?: boolean;
  catalog?: CatalogItem | null;
}): CustomerPriceCopy {
  if (params.priceOnRequest) {
    return { label: "Solicitar orçamento", amountCents: null };
  }
  if (params.kind === "product") {
    return { label: "Preço", amountCents: params.sellerPriceCents ?? null };
  }
  if (params.kind === "health" || params.catalog?.suite === "HEALTH") {
    const amount = params.providerPriceCents ?? params.catalog?.referenceTutorCents ?? null;
    return {
      label: params.catalog?.complexProcedure ? "Referência" : "Referência",
      amountCents: amount,
      hint: params.catalog?.complexProcedure
        ? "Referência comercial. Materiais, porte, espécie, complexidade e horário podem alterar o orçamento. Não é preço final garantido."
        : "Referência EccoPet. O estabelecimento é responsável pelo preço profissional.",
    };
  }
  const amount = params.providerPriceCents ?? params.catalog?.referenceTutorCents ?? null;
  return { label: "A partir de", amountCents: amount };
}

export function quoteToDisplay(quote: PricingQuote) {
  return {
    version: quote.pricingVersion,
    customerPays: formatBrlFromCents(quote.customerAmountCents),
    partnerEconomic: formatBrlFromCents(quote.partnerEconomicAmountCents),
    eccopetCommission: formatBrlFromCents(quote.eccopetCommissionCents),
    fixedFee: formatBrlFromCents(quote.fixedFeeCents),
    bookingFee: formatBrlFromCents(quote.bookingFeeCents),
    urgentFee: formatBrlFromCents(quote.urgentFeeCents),
    reserve: formatBrlFromCents(quote.reserveCents),
    pspEstimate: formatBrlFromCents(quote.estimatedPspCents),
    taxEstimate: formatBrlFromCents(quote.estimatedTaxProvisionCents),
    contributionEstimate: formatBrlFromCents(quote.contributionEstimateCents),
    payoutEstimate: formatBrlFromCents(quote.estimatedPayoutCents),
    labels: quote.labels,
  };
}
