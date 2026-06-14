import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import Link from "next/link";

type Props = { params: Promise<{ productId: string }> };

export default async function PartnerProductDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/products");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  const { productId } = await params;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Produto</h1>
      <p className="text-sm text-muted-foreground">ID: {productId}</p>
      <Link href={`/dashboard/partner/products/${productId}/edit`} className="mt-4 inline-block text-sm underline">Editar</Link>
    </main>
  );
}
