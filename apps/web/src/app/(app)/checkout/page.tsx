import { redirect } from "next/navigation";

/** Redireciona checkout legado para o checkout do marketplace */
export default function LegacyCheckoutRedirect() {
  redirect("/marketplace/checkout");
}
