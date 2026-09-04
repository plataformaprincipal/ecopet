import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import {
  ensureApprovedPartnerUser,
  ensureClientUser,
  json,
  loginContext,
} from "./helpers/social";

const prisma = new PrismaClient();

const checkoutBody = {
  deliveryMethod: "PICKUP_LOCAL" as const,
  paymentMethod: "PIX" as const,
  phone: "11999990000",
  address: { street: "Rua A", city: "Sao Paulo", state: "SP", zipCode: "01310100" },
};

test.describe("Chat nativo comercial CLIENT↔PARTNER", () => {
  test.describe.configure({ timeout: 120_000 });

  test("FLUXO 1: mensagens + recusa orçamento + RBAC + expirado + reload", async ({ browser }) => {
    const client = await ensureClientUser("chatc1");
    const partner = await ensureApprovedPartnerUser("chatp1");
    const stranger = await ensureClientUser("chats1");

    const clientCtx = await browser.newContext();
    const partnerCtx = await browser.newContext();
    const strangerCtx = await browser.newContext();
    await loginContext(clientCtx, client.email);
    await loginContext(partnerCtx, partner.email);
    await loginContext(strangerCtx, stranger.email);

    const opened = await json(clientCtx.request, "POST", "/api/messages/conversations", {
      participantUserId: partner.id,
      contextType: "GENERAL",
      description: "Quero um serviço personalizado",
      quantity: 1,
    });
    expect([200, 201]).toContain(opened.status);
    const conversationId = opened.body.data?.conversationId ?? opened.body.data?.conversation?.id;
    expect(conversationId).toBeTruthy();

    const listed = await json(partnerCtx.request, "GET", "/api/messages/conversations");
    expect(listed.status).toBe(200);
    expect((listed.body.data?.items ?? []).some((c: { id: string }) => c.id === conversationId)).toBeTruthy();

    expect(
      (await json(clientCtx.request, "POST", `/api/messages/conversations/${conversationId}/messages`, {
        content: "Olá, preciso de um orçamento.",
      })).status
    ).toBe(201);
    expect(
      (await json(partnerCtx.request, "POST", `/api/messages/conversations/${conversationId}/messages`, {
        content: "Olá! Vou enviar o orçamento.",
      })).status
    ).toBe(201);

    const quoteReject = await json(
      partnerCtx.request,
      "POST",
      `/api/messages/conversations/${conversationId}/quotes`,
      {
        name: "Banho e tosa",
        items: [{ description: "Banho completo", quantity: 1, unitPrice: 120 }],
        shippingAmount: 10,
        discountAmount: 5,
        total: 1,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Inclui hidratação",
      }
    );
    expect(quoteReject.status, JSON.stringify(quoteReject.body)).toBe(201);
    expect(quoteReject.body.data?.quote?.totalAmount).toBeGreaterThan(1);
    expect(quoteReject.body.data?.quote?.totalAmount).not.toBe(1);

    const refuse = await json(
      clientCtx.request,
      "POST",
      `/api/messages/quotes/${quoteReject.body.data.quote.id}?action=reject`,
      { reason: "Fora do orçamento" }
    );
    expect(refuse.status).toBe(200);
    expect(refuse.body.data?.quote?.status).toBe("REJECTED");

    const expired = await json(
      partnerCtx.request,
      "POST",
      `/api/messages/conversations/${conversationId}/quotes`,
      {
        name: "Expirado",
        items: [{ description: "Item", quantity: 1, unitPrice: 80 }],
        validUntil: new Date(Date.now() - 60_000).toISOString(),
      }
    );
    expect(expired.status).toBe(201);
    const acceptExpired = await json(
      clientCtx.request,
      "POST",
      `/api/messages/quotes/${expired.body.data.quote.id}?action=accept`,
      {}
    );
    expect(acceptExpired.status).toBe(409);

    expect((await json(strangerCtx.request, "GET", `/api/messages/conversations/${conversationId}`)).status).toBe(403);
    expect(
      (
        await json(strangerCtx.request, "POST", `/api/messages/conversations/${conversationId}/messages`, {
          content: "intruso",
        })
      ).status
    ).toBe(403);

    const page = await clientCtx.newPage();
    await page.goto(`/dashboard/messages/${conversationId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("native-conversation")).toBeVisible({ timeout: 20_000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("native-conversation")).toBeVisible();
    await expect(page.getByText("Carregando conversas...")).toHaveCount(0);

    await clientCtx.close();
    await partnerCtx.close();
    await strangerCtx.close();
  });

  test("FLUXO 2: aceitar orçamento → carrinho → checkout → pedido concluído", async ({ browser }) => {
    const client = await ensureClientUser("chatc2");
    const partner = await ensureApprovedPartnerUser("chatp2");
    const clientCtx = await browser.newContext();
    const partnerCtx = await browser.newContext();
    await loginContext(clientCtx, client.email);
    await loginContext(partnerCtx, partner.email);

    const opened = await json(clientCtx.request, "POST", "/api/messages/conversations", {
      participantUserId: partner.id,
    });
    const conversationId = opened.body.data?.conversationId ?? opened.body.data?.conversation?.id;

    const created = await json(
      partnerCtx.request,
      "POST",
      `/api/messages/conversations/${conversationId}/quotes`,
      {
        name: "Consulta",
        items: [{ description: "Consulta clínica", quantity: 1, unitPrice: 150 }],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    );
    expect(created.status).toBe(201);
    const accept = await json(
      clientCtx.request,
      "POST",
      `/api/messages/quotes/${created.body.data.quote.id}?action=accept`,
      { total: 0.01 }
    );
    expect(accept.status, JSON.stringify(accept.body)).toBe(200);
    expect(accept.body.data?.quote?.status).toBe("ACCEPTED");
    expect(accept.body.data?.quote?.totalAmount).toBeGreaterThan(1);

    const cart = await json(clientCtx.request, "GET", "/api/cart");
    expect((cart.body.data?.cart?.items ?? []).some((i: { itemType: string }) => i.itemType === "QUOTE")).toBeTruthy();

    const checkout = await json(clientCtx.request, "POST", "/api/checkout", checkoutBody);
    expect([200, 201], JSON.stringify(checkout.body)).toContain(checkout.status);
    const orderId = checkout.body.data?.order?.id as string;
    expect(orderId).toBeTruthy();

    for (const status of ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "COMPLETED"]) {
      const res = await json(partnerCtx.request, "PATCH", `/api/partner/orders/${orderId}/status`, { status });
      expect(res.status, `${status} ${JSON.stringify(res.body)}`).toBe(200);
    }

    await clientCtx.close();
    await partnerCtx.close();
  });

  test("FLUXO 3: cancelamento e recusa após pagamento com refund", async ({ browser }) => {
    const client = await ensureClientUser("chatc3");
    const partner = await ensureApprovedPartnerUser("chatp3");
    const clientCtx = await browser.newContext();
    const partnerCtx = await browser.newContext();
    await loginContext(clientCtx, client.email);
    await loginContext(partnerCtx, partner.email);

    const opened = await json(clientCtx.request, "POST", "/api/messages/conversations", {
      participantUserId: partner.id,
    });
    const conversationId = opened.body.data?.conversationId ?? opened.body.data?.conversation?.id;

    const q1 = await json(partnerCtx.request, "POST", `/api/messages/conversations/${conversationId}/quotes`, {
      name: "Cancelável",
      items: [{ description: "Item cancel", quantity: 1, unitPrice: 90 }],
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect((await json(clientCtx.request, "POST", `/api/messages/quotes/${q1.body.data.quote.id}?action=accept`, {})).status).toBe(200);
    const checkout1 = await json(clientCtx.request, "POST", "/api/checkout", {
      ...checkoutBody,
      phone: "11999990001",
    });
    expect([200, 201], JSON.stringify(checkout1.body)).toContain(checkout1.status);
    const cancelled = await json(clientCtx.request, "PATCH", `/api/client/orders/${checkout1.body.data.order.id}/cancel`, {});
    expect(cancelled.status, JSON.stringify(cancelled.body)).toBe(200);

    const q2 = await json(partnerCtx.request, "POST", `/api/messages/conversations/${conversationId}/quotes`, {
      name: "Reembolso",
      items: [{ description: "Item refund", quantity: 1, unitPrice: 110 }],
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect((await json(clientCtx.request, "POST", `/api/messages/quotes/${q2.body.data.quote.id}?action=accept`, {})).status).toBe(200);
    const checkout2 = await json(clientCtx.request, "POST", "/api/checkout", {
      ...checkoutBody,
      phone: "11999990002",
    });
    expect([200, 201], JSON.stringify(checkout2.body)).toContain(checkout2.status);
    const order3 = checkout2.body.data?.order?.id as string;
    const payment = await prisma.payment.findFirst({ where: { orderId: order3 } });
    expect(payment).toBeTruthy();
    await prisma.payment.update({
      where: { id: payment!.id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
    await prisma.order.update({ where: { id: order3 }, data: { status: "PAID" } });

    const rejectPaid = await json(partnerCtx.request, "POST", `/api/partner/orders/${order3}/reject`, {
      reason: "Sem agenda para o atendimento solicitado",
    });
    expect(rejectPaid.status, JSON.stringify(rejectPaid.body)).toBe(200);
    expect(["mp_refund", "local_refund"]).toContain(rejectPaid.body.data?.mode);

    await clientCtx.close();
    await partnerCtx.close();
  });
});
