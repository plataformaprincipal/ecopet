import { redirect } from "next/navigation";

/** Alias → hub de eventos / pedidos via financeiro. */
export default function AdminMpOrdersPage() {
  redirect("/admin/mercado-pago/eventos");
}
