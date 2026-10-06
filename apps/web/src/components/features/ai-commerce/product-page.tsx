"use client";

import { AiWorkbench } from "./workspace";

/** Loja paga: resumo, Mercado Pago, Order, entitlement e depois o workbench. */
export function AiProductPage({ slug }: { slug: string }) {
  return <AiWorkbench slug={slug} />;
}
