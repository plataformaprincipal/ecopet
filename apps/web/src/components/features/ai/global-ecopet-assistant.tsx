"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const EcopetAIAssistant = dynamic(
  () =>
    import("@/components/features/ai/ecopet-ai-assistant").then((m) => ({
      default: m.EcopetAIAssistant,
    })),
  { ssr: false }
);

const HIDDEN_PREFIXES = ["/eccopet", "/admin", "/gestor", "/dashboard/admin"];
const HIDDEN_EXACT = ["/client/eccopet", "/partner/eccopet", "/ngo/eccopet"];

function shouldShowAssistant(pathname: string): boolean {
  if (HIDDEN_EXACT.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return true;
}

/** Assistente pessoal global — inferior esquerdo; não conflita com a11y (direita). */
export function GlobalEcopetAssistant() {
  const pathname = usePathname();
  if (!shouldShowAssistant(pathname)) return null;
  return <EcopetAIAssistant />;
}
