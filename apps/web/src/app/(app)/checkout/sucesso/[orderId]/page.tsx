import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutPayAgain } from "@/components/features/marketplace/checkout-pay-again";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ payment?: string; status?: string }>;
};

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const order = user
    ? await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          payments: {
            where: { provider: "mercado_pago" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              paymentMethod: true,
              statusDetail: true,
              amount: true,
            },
          },
        },
      })
    : null;

  const payment = order?.payments[0];
  const statusLabel = sp.status || payment?.status || order?.status || "PENDING";
  const confirming =
    order?.status === "PENDING_CONFIRMATION" ||
    payment?.status === "PROCESSING" ||
    payment?.status === "IN_PROCESS" ||
    statusLabel === "PROCESSING" ||
    statusLabel === "IN_PROCESS" ||
    statusLabel === "PENDING_CONFIRMATION";
  const paid = statusLabel === "APPROVED" || order?.status === "PAID";
  const failed = ["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(
    String(payment?.status || statusLabel)
  );
  const canRetry =
    Boolean(order) &&
    order!.status !== "PAID" &&
    order!.status !== "CANCELLED" &&
    order!.status !== "REFUNDED" &&
    !confirming &&
    (!payment ||
      ["REJECTED", "CANCELLED", "EXPIRED", "ERROR", "PENDING", "CREATED"].includes(payment.status));

  return (
    <main className="mx-auto max-w-lg p-6">
      <Card>
        <CardContent className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">
            {paid
              ? "Pagamento confirmado"
              : confirming
                ? "Pagamento em confirmação"
                : failed
                  ? "Pagamento não concluído"
                  : "Pedido registrado"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {paid
              ? "Recebemos a confirmação do pagamento. O pedido segue para o parceiro."
              : confirming
                ? "Recebemos seu pedido e estamos confirmando o pagamento com o provedor. Isso pode levar alguns instantes — atualize esta página em breve. Não tente pagar de novo até ver o status final."
                : failed
                  ? `Não foi possível concluir o pagamento (${payment?.status || statusLabel}${
                      payment?.statusDetail ? ` · ${payment.statusDetail}` : ""
                    }). Você pode tentar novamente.`
                  : payment
                    ? `Status do pagamento: ${payment.status}${
                        payment.statusDetail ? ` (${payment.statusDetail})` : ""
                      }.`
                    : "Seu pedido foi criado. Se escolheu pagamento na entrega, combine com o parceiro."}
          </p>
          {order ? (
            <p className="text-sm">
              Pedido #{order.orderNumber} · R$ {Number(order.total).toFixed(2)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">ID: {orderId}</p>
          )}
          {canRetry && user?.email ? (
            <CheckoutPayAgain
              orderId={orderId}
              amount={Number(order?.total ?? 0)}
              payerEmail={user.email}
            />
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/client/orders">Meus pedidos</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/produtos">Continuar comprando</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
