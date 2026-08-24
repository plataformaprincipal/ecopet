"use client";

import { AiWorkbench } from "./workspace";

/** FREE_BETA: o CTA Usar agora cria a sessão em /api/ai-commerce/executions e abre o workbench. */
export function AiProductPage({ slug }: { slug: string }) {
  return <AiWorkbench slug={slug} />;
}
