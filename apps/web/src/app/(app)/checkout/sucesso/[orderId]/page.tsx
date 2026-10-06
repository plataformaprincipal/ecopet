import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutPayAgain } from "@/components/features/marketplace/checkout-pay-again";
import { CheckoutPaymentPoller } from "@/components/features/marketplace/checkout-payment-poller";
import { CheckoutPolicies } from "@/components/features/marketplace/checkout-policies";
import { PIX_WAIT_MS } from "@/lib/checkout/payment-wait";
import { isEccopetSelfFulfilledItem, resolveEccopetAccess } from "@/lib/commerce/eccopet-access";
import { fulfillApprovedOrder } from "@/lib/commerce/fulfill-approved-order";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

const DIGITAL_TYPES = new Set(["DIGITAL_AI", "CATALOG_SKU", "AI_PRODUCT", "AI_CREDIT"]);

export default async function CheckoutSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();

  const order = user
    ? await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          partnerId: true,
          items: { select: { itemType: true, sku: true, name: true, partnerId: true } },
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
  const method = String(payment?.paymentMethod || "").toLowerCase();
  const statusLabel = payment?.status || order?.status || "PENDING";
  const confirming =
    order?.status === "PENDING_CONFIRMATION" ||
    payment?.status === "PROCESSING" ||
    payment?.status === "IN_PROCESS" ||
    payment?.status === "PENDING" ||
    payment?.status === "CREATED" ||
    payment?.status === "ACTION_REQUIRED";
  const paid = order?.status === "PAID" || payment?.status === "APPROVED";
  if (order && paid) {
    await fulfillApprovedOrder(order.id, payment?.id ?? null).catch(() => undefined);
  }
  const failed = ["REJECTED", "CANCELLED", "EXPIRED", "ERROR"].includes(
    String(payment?.status || statusLabel)
  );
  const pixWaiting = !paid && !failed && (method === "pix" || method.includes("pix"));
  const boletoIssued = !paid && !failed && (method === "boleto" || method === "ticket" || method.includes("bol"));
  const canRetry =
    Boolean(order) &&
    order!.status !== "PAID" &&
    order!.status !== "CANCELLED" &&
    order!.status !== "REFUNDED" &&
    !confirming &&
    (!payment ||
      ["REJECTED", "CANCELLED", "EXPIRED", "ERROR", "PENDING", "CREATED"].includes(payment.status));

  const items = order?.items ?? [];
  const eccopetItems = items.filter((item) =>
    isEccopetSelfFulfilledItem({ sku: item.sku, itemType: item.itemType, partnerId: item.partnerId })
  );
  const hasDigital = eccopetItems.some((item) => DIGITAL_TYPES.has(item.itemType) || Boolean(resolveEccopetAccess(item.sku)));
  const partnerItem = items.some(
    (item) => !isEccopetSelfFulfilledItem({ sku: item.sku, itemType: item.itemType, partnerId: item.partnerId ?? order?.partnerId })
  );
  const trackHref = `/dashboard/client/orders/${orderId}`;
  const accessLinks = eccopetItems
    .map((item) => resolveEccopetAccess(item.sku))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const title = paid
    ? "Pedido confirmado"
    : failed
      ? "Pagamento recusado"
      : boletoIssued
        ? "Boleto emitido"
        : pixWaiting
          ? "Aguardando pagamento / Processando"
          : confirming
            ? "Aguardando confirmação"
            : "Pagamento pendente";

  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Card className="rounded-2xl border-[var(--ep-border)] shadow-sm">
        <CardContent className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {paid && hasDigital && partnerItem
              ? "Pagamento aprovado. Seu acesso EccoPet já está disponível. Itens de parceiro aguardam confirmação."
              : paid && hasDigital
              ? "Pagamento aprovado. Seu acesso EccoPet foi liberado."
              : paid && partnerItem
                ? "Pagamento aprovado. O parceiro recebeu o pedido e você já pode acompanhar o andamento."
                : paid
                  ? "Recebemos a confirmação do Mercado Pago."
                  : failed
                    ? `Pagamento recusado (${payment?.status || statusLabel}${
                        payment?.statusDetail ? ` · ${payment.statusDetail}` : ""
                      }). Você pode tentar novamente.`
                    : boletoIssued
                      ? "Boleto emitido. Status pendente até a compensação. Após o vencimento, o boleto fica inválido/expirado."
                      : pixWaiting
                        ? "Pix gerado. Estamos aguardando a confirmação do seu Pix. Se o prazo da tela expirar sem pagamento, o status fica expirado — isso não significa recusa do banco."
                        : confirming
                          ? "Aguardando confirmação. Acompanhe o pedido — não pague de novo até ver o status final."
                          : "Conclua o pagamento online com cartão, Pix ou boleto."}
          </p>
          {order ? (
            <p className="text-sm">
              Pedido #{order.orderNumber} · R$ {Number(order.total).toFixed(2)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">ID: {orderId}</p>
          )}
          {confirming && order ? (
            <CheckoutPaymentPoller
              orderId={order.id}
              paymentId={payment?.id}
              deadlineMs={pixWaiting ? PIX_WAIT_MS : 72_000}
              awaitingLabel={
                pixWaiting ? "Aguardando pagamento / Processando" : "Aguardando confirmação"
              }
            />
          ) : null}
          {canRetry && user?.email ? (
            <CheckoutPayAgain
              orderId={orderId}
              amount={Number(order?.total ?? 0)}
              payerEmail={user.email}
            />
          ) : null}
          <div className="flex flex-wrap justify-center gap-3">
            {paid && accessLinks.map((access) => (
              <Button asChild key={access.sku}>
                <Link href={access.href}>{access.ctaLabel}</Link>
              </Button>
            ))}
            {paid && hasDigital && accessLinks.length === 0 ? (
              <Button asChild>
                <Link href="/eccopet">Usar agora</Link>
              </Button>
            ) : null}
            {paid && partnerItem ? (
              <Button asChild>
                <Link href={trackHref}>Acompanhar pedido</Link>
              </Button>
            ) : null}
            {confirming || pixWaiting || boletoIssued ? (
              <Button asChild variant={paid ? "outline" : "default"}>
                <Link href={trackHref}>Acompanhar pedido</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/dashboard/client/orders">Meus pedidos</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/produtos">Continuar comprando</Link>
            </Button>
          </div>
          <CheckoutPolicies className="border-t border-[var(--ep-border)] pt-4 text-left" />
        </CardContent>
      </Card>
    </main>
  );
}
