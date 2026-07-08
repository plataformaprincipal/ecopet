import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientDocumentsPage } from "@/components/features/client/pages/client-documents-page";

export default async function ClientDocumentosRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/documentos");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return <ClientDocumentsPage />;
}
