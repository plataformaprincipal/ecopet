import { redirect } from "next/navigation";

export default function GestorIndexPage() {
  redirect("/dashboard/admin/gestor/overview");
}
