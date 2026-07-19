import { redirect } from "next/navigation";

/** Alias de segurança → painel Turnstile. */
export default function AdminSegurancaBotsPage() {
  redirect("/admin/integracoes/turnstile");
}
