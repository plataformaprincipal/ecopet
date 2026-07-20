/**
 * Ferramentas de ação com confirmação explícita para mutações sensíveis.
 */
import "server-only";

import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addToCart, getOrCreateCart } from "@/lib/cart/cart-service";
import { createNotification } from "@/lib/notifications/notification-service";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { isAiFlagEnabled } from "./feature-flags";
import { agentAllowsSensitiveAction, resolveEcoPetAgent } from "./agent-orchestrator";

export type ActionToolResult = {
  ok: boolean;
  requiresConfirmation?: boolean;
  confirmationToken?: string;
  message: string;
  data?: Record<string, unknown>;
};

const pendingConfirmations = new Map<
  string,
  { userId: string; tool: string; params: Record<string, unknown>; expiresAt: number }
>();

function issueConfirmation(userId: string, tool: string, params: Record<string, unknown>) {
  const token = `ai_confirm_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  pendingConfirmations.set(token, {
    userId,
    tool,
    params,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  return token;
}

export async function executeAiActionTool(input: {
  userId: string;
  role: UserRole;
  tool: string;
  params: Record<string, unknown>;
  confirmed?: boolean;
  confirmationToken?: string;
  pagePath?: string;
}): Promise<ActionToolResult> {
  if (!isAiFlagEnabled("tools")) {
    return { ok: false, message: "Ferramentas IA desativadas." };
  }

  const agent = resolveEcoPetAgent({
    role: input.role,
    pagePath: input.pagePath,
  });

  if (!agentAllowsSensitiveAction(agent.agentId, input.tool)) {
    await writeAiAuditLog({
      userId: input.userId,
      role: input.role,
      module: "tools",
      action: input.tool,
      decision: "DENY",
      metadata: { reason: "sensitive_blocked" },
    });
    return { ok: false, message: "Ação sensível bloqueada. Use o fluxo formal da plataforma." };
  }

  if (input.confirmationToken && input.confirmed) {
    const pending = pendingConfirmations.get(input.confirmationToken);
    if (!pending || pending.userId !== input.userId || pending.expiresAt < Date.now()) {
      return { ok: false, message: "Confirmação expirada ou inválida." };
    }
    pendingConfirmations.delete(input.confirmationToken);
    return runAction(input.userId, input.role, pending.tool, pending.params);
  }

  const needsConfirm = ["add_to_cart", "mark_notification_read", "create_reminder_draft"].includes(
    input.tool
  );

  if (needsConfirm && !input.confirmed) {
    const token = issueConfirmation(input.userId, input.tool, input.params);
    await writeAiAuditLog({
      userId: input.userId,
      role: input.role,
      module: "tools",
      action: input.tool,
      decision: "CONFIRM_REQUIRED",
    });
    return {
      ok: true,
      requiresConfirmation: true,
      confirmationToken: token,
      message: "Confirme a ação para continuar.",
      data: { tool: input.tool, params: input.params },
    };
  }

  return runAction(input.userId, input.role, input.tool, input.params);
}

async function runAction(
  userId: string,
  role: UserRole,
  tool: string,
  params: Record<string, unknown>
): Promise<ActionToolResult> {
  try {
    if (tool === "add_to_cart") {
      const schema = z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20).default(1),
      });
      const p = schema.parse(params);
      const product = await prisma.product.findFirst({
        where: { id: p.productId, deletedAt: null, status: "ACTIVE", approvalStatus: "APPROVED" },
        select: { id: true, stock: true, name: true },
      });
      if (!product) return { ok: false, message: "Produto não encontrado ou indisponível." };
      if (product.stock < p.quantity) {
        return { ok: false, message: "Estoque insuficiente." };
      }
      const cart = await getOrCreateCart(userId);
      await addToCart(cart, p.productId, p.quantity);
      await writeAiAuditLog({
        userId,
        role,
        module: "tools",
        action: "add_to_cart",
        entityType: "product",
        entityId: p.productId,
        decision: "EXECUTED",
      });
      return {
        ok: true,
        message: `Item adicionado ao carrinho: ${product.name}`,
        data: { productId: product.id, quantity: p.quantity },
      };
    }

    if (tool === "mark_notification_read") {
      const schema = z.object({ notificationId: z.string().min(1) });
      const p = schema.parse(params);
      const updated = await prisma.notification.updateMany({
        where: { id: p.notificationId, userId },
        data: { read: true, readAt: new Date() },
      });
      if (!updated.count) return { ok: false, message: "Notificação não encontrada." };
      await writeAiAuditLog({
        userId,
        role,
        module: "tools",
        action: "mark_notification_read",
        entityId: p.notificationId,
        decision: "EXECUTED",
      });
      return { ok: true, message: "Notificação marcada como lida." };
    }

    if (tool === "create_reminder_draft") {
      const schema = z.object({
        title: z.string().min(1).max(120),
        dueAt: z.string().datetime().optional(),
      });
      const p = schema.parse(params);
      const row = await createNotification({
        userId,
        type: "APPOINTMENT",
        title: `Lembrete (rascunho IA): ${p.title}`,
        message: p.dueAt
          ? `Lembrete sugerido para ${p.dueAt}. Confirme na agenda.`
          : "Lembrete sugerido pela EcoPet IA. Confirme na agenda.",
        metadata: { source: "ai_action_tool", draft: true, dueAt: p.dueAt ?? null },
        actionUrl: "/client/agenda",
      });
      await writeAiAuditLog({
        userId,
        role,
        module: "tools",
        action: "create_reminder_draft",
        decision: "DRAFT",
        metadata: { notificationId: row?.id },
      });
      return {
        ok: true,
        message: "Rascunho de lembrete criado como notificação. Não agenda automaticamente.",
        data: { notificationId: row?.id ?? null },
      };
    }

    return { ok: false, message: `Ferramenta desconhecida: ${tool}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha na ferramenta";
    return { ok: false, message };
  }
}
