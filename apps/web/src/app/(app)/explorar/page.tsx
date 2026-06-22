import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export default async function ExplorarPage() {
  const user = await getCurrentUser();
  if (user?.role === UserRole.CLIENT) {
    redirect("/cliente/explorar");
  }

  const { PublicExplorePage } = await import(
    "@/components/features/public-client/pages/public-explore-page"
  );
  return <PublicExplorePage />;
}
