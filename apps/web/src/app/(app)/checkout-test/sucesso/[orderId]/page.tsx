import Link from "next/link";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutTestBanner } from "@/components/features/marketplace/checkout-test-banner";
import { CheckoutTestPaymentPoller } from "@/components/features/marketplace/checkout-test-payment-poller";
import { isCheckoutTestOrderNotes } from "@/lib/mercado-pago/test-credentials";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout de teste — resultado",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CheckoutTestSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/checkout-test");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      deliveryNotes: true,
      payments: {
        where: { provider: "mercado_pago", environment: "test" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          statusDetail: true,
          amount: true,
          providerOrderId: true,
          providerPaymentId: true,
          metadata: true,
        },
      },
    },
  });

  if (!order || !isCheckoutTestOrderNotes(order.deliveryNotes)) {
    notFound();
  }

  const payment = order.payments[0];
  const meta = (payment?.metadata as Record<string, unknown> | null) ?? {};
  const mpOrderId =
    payment?.providerOrderId ||
    (typeof meta.mercadoPagoOrderId === "string" ? meta.mercadoPagoOrderId : null);
  const mpPaymentId = payment?.providerPaymentId ?? null;
  const statusLabel = payment?.status || order.status || "PENDING";
  const confirming =
    payment?.status === "PROCESSING" ||
    payment?.status === "IN_PROCESS" ||
    payment?.status === "PENDING" ||
    payment?.status === "CREATED";
  const paid = payment?.status === "APPROVED";
  const failed = ["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(String(statusLabel));

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <CheckoutTestBanner />
      <Card>
        <CardContent className="space-y-4 p-6 text-center">
          <p className="text-xs font-bold tracking-wide text-amber-800 dark:text-amber-200">
            AMBIENTE: TESTE
          </p>
          <p className="text-xs font-bold tracking-wide text-amber-800 dark:text-amber-200">
            PAGAMENTO REAL: NÃO
          </p>
          <h1 className="text-2xl font-semibold">
            {paid
              ? "Pagamento de teste confirmado"
              : confirming
                ? "Pagamento de teste em confirmação"
                : failed
                  ? "Pagamento de teste não concluído"
                  : "Pedido de teste registrado"}
          </h1>
          <p className="text-sm">
            Pedido #{order.orderNumber} · R$ {Number(order.total).toFixed(2)}
          </p>
          {mpOrderId ? (
            <div className="rounded border border-dashed px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Mercado Pago Order ID</p>
              <p className="break-all font-mono font-semibold">{mpOrderId}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Mercado Pago Order ID ainda não persistido.
            </p>
          )}
          {mpPaymentId ? (
            <div className="rounded border border-dashed px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Payment ID</p>
              <p className="break-all font-mono font-semibold">{mpPaymentId}</p>
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">Status: {statusLabel}</p>
          {confirming && !paid ? (
            <CheckoutTestPaymentPoller orderId={order.id} paymentId={payment?.id} />
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/checkout-test">Nova tentativa de teste</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
