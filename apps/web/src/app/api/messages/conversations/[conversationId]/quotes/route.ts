import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { createAndSendQuote, getConversationQuotes } from "@/lib/commerce-chat/quotes";
import { ChatError } from "@/lib/messages/utils";
import { PricingError } from "@/lib/pricing/service";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  description: z.string().min(1).max(240),
  quantity: z.number().int().min(1).max(999),
  unitPrice: z.number().min(0),
  sku: z.string().max(80).optional().nullable(),
  productId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
});

const createSchema = z.object({
  name: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  items: z.array(itemSchema).min(1).max(50),
  discountAmount: z.number().min(0).optional(),
  shippingAmount: z.number().min(0).optional(),
  total: z.number().optional(),
  validUntil: z.string().min(1),
  executionDays: z.number().int().min(0).max(365).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  conditions: z.string().max(2000).optional().nullable(),
  petId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
});

type Params = { params: Promise<{ conversationId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    const quotes = await getConversationQuotes(conversationId, user!.id);
    return apiSuccess({ quotes });
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
    }
    const quote = await createAndSendQuote({
      conversationId,
      actorId: user!.id,
      name: parsed.data.name,
      description: parsed.data.description,
      items: parsed.data.items,
      discountAmount: parsed.data.discountAmount,
      shippingAmount: parsed.data.shippingAmount,
      claimedTotal: parsed.data.total,
      validUntil: new Date(parsed.data.validUntil),
      executionDays: parsed.data.executionDays,
      notes: parsed.data.notes,
      conditions: parsed.data.conditions,
      petId: parsed.data.petId,
      productId: parsed.data.productId,
      serviceId: parsed.data.serviceId,
    });
    return apiSuccess({ quote }, 201);
  } catch (e) {
    if (e instanceof PricingError) return apiFailure(e.code, e.message, 503);
    if (e instanceof Error && e.message.startsWith("QUOTE_")) {
      return handleChatRouteError(new ChatError("Itens inválidos.", e.message, 400));
    }
    return handleChatRouteError(e);
  }
}
