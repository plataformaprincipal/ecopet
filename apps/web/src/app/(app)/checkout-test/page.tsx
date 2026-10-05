import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutTestPanel } from "@/components/features/marketplace/checkout-test-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout de teste",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CheckoutTestPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) notFound();
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Checkout de teste</h1>
      <p className="text-sm text-muted-foreground">
        Rota temporária e isolada para uma compra Mercado Pago TEST no domínio de produção. O
        checkout normal não é usado. Acesso restrito a ADMIN.
      </p>
      <CheckoutTestPanel />
    </main>
  );
}
