import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export default async function MeuPetPage() {
  const user = await getCurrentUser();

  if (user?.role === UserRole.CLIENT) {
    redirect("/cliente/meu-pet");
  }

  if (user) {
    const { meuPetPathForRole } = await import("@/lib/public-client/auth-redirect");
    redirect(meuPetPathForRole(user.role));
  }

  const { PublicMeuPetPreview } = await import(
    "@/components/features/public-client/public-meu-pet-preview"
  );
  return <PublicMeuPetPreview />;
}
