import type { CustomQuote } from "./types";

/** Orçamentos — somente dados reais via API (não implementado). */
export function getQuotesForClient(_clientId?: string): CustomQuote[] {
  return [];
}

export function getQuoteById(_id: string): CustomQuote | undefined {
  return undefined;
}

export function getQuotesForPartner(_partnerId?: string): CustomQuote[] {
  return [];
}
