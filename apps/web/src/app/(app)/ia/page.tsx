import { redirect } from "next/navigation";

/** Compatibilidade: o módulo de IA canônico é EccoPet AI. */
export default function IaLegacyRedirect() {
  redirect("/eccopet");
}
