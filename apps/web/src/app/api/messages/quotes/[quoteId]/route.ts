import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { acceptQuote, getQuoteForUser, rejectQuote, reviseQuote } from "@/lib/commerce-chat/quotes";
import { PricingError } from "@/lib/pricing/service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ quoteId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { quoteId } = await params;
    const quote = await getQuoteForUser(quoteId, user!.id);
    return apiSuccess({ quote });
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { quoteId } = await params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));

    if (action === "reject") {
      const quote = await rejectQuote({
        quoteId,
        actorId: user!.id,
        reason: typeof body.reason === "string" ? body.reason : null,
      });
      return apiSuccess({ quote });
    }

    if (action === "accept") {
      const result = await acceptQuote({
        quoteId,
        actorId: user!.id,
        claimedTotal: typeof body.total === "number" ? body.total : undefined,
      });
      return apiSuccess(result);
    }

    return apiFailure("VALIDATION", "Informe action=accept ou action=reject.", 400);
  } catch (e) {
    if (e instanceof PricingError) return apiFailure(e.code, e.message, 503);
    return handleChatRouteError(e);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { quoteId } = await params;
    const body = await req.json().catch(() => ({}));
    const quote = await reviseQuote({
      quoteId,
      actorId: user!.id,
      items: Array.isArray(body.items) ? body.items : undefined,
      discountAmount: typeof body.discountAmount === "number" ? body.discountAmount : undefined,
      shippingAmount: typeof body.shippingAmount === "number" ? body.shippingAmount : undefined,
      claimedTotal: typeof body.total === "number" ? body.total : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      conditions: typeof body.conditions === "string" ? body.conditions : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
    });
    return apiSuccess({ quote });
  } catch (e) {
    if (e instanceof PricingError) return apiFailure(e.code, e.message, 503);
    return handleChatRouteError(e);
  }
}
