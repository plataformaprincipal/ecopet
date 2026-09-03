import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { isAiMonetizationFree } from "@/lib/ai-commerce/flags";
import { quoteEccoPetSaudeTier, type EccoPetSaudeTierId } from "@/lib/eccopet-saude/plans";
import { isCheckoutEnabled } from "@/lib/commerce/checkout-flags";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  tierId: z.enum(["essencial", "plus", "familia"]),
  petId: z.string().min(1),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Selecione o plano e o pet.", 400);

  const pet = await prisma.pet.findFirst({
    where: { id: parsed.data.petId, ownerId: user!.id, deletedAt: null },
    select: { id: true },
  });
  if (!pet) return apiFailure("PET_FORBIDDEN", "Pet não encontrado.", 403);

  const quoted = quoteEccoPetSaudeTier(parsed.data.tierId as EccoPetSaudeTierId);
  if (!quoted) return apiFailure("SKU_UNKNOWN", "Plano não encontrado no catálogo.", 404);

  if (!quoted.quote.purchasable || !isCheckoutEnabled()) {
    if (!isAiMonetizationFree()) {
      return apiFailure(
        "NOT_PURCHASABLE",
        `Checkout deste plano não está habilitado. Motivo: ${(quoted.quote.blockedReasons ?? []).join(", ") || "CATALOG_ONLY"}. O preço oficial permanece no motor.`,
        409
      );
    }
    const starts = new Date();
    const ends = new Date(starts.getTime() + quoted.tier.periodDays * 24 * 60 * 60 * 1000);
    const existing = await prisma.petHealthProfile.findUnique({ where: { petId: pet.id } });
    const prev = (existing?.lastSummary as Record<string, unknown> | null) ?? {};
    const next = {
      ...prev,
      eccopetSaudePlan: {
        tierId: quoted.tier.id,
        sku: quoted.tier.sku,
        seller: "ECCOPET",
        source: "FREE_BETA",
        recurringBilling: false,
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        provenance: "SYSTEM_CALCULATED",
      },
    };
    if (existing) {
      await prisma.petHealthProfile.update({
        where: { petId: pet.id },
        data: { lastSummary: next as Prisma.InputJsonValue },
      });
    } else {
      await prisma.petHealthProfile.create({
        data: { petId: pet.id, userId: user!.id, lastSummary: next as Prisma.InputJsonValue },
      });
    }
    return apiSuccess({
      mode: "FREE_BETA",
      entitlementPeriodDays: quoted.tier.periodDays,
      recurringBilling: false,
      quote: quoted.quote,
      endsAt: ends.toISOString(),
    });
  }

  return apiFailure(
    "CHECKOUT_NOT_WIRED_FOR_CATALOG_HEALTH",
    "O item está PURCHASABLE no motor, mas o checkout de Saúde EccoPet ainda usa o fluxo de serviço com prestador. Não simulamos pagamento.",
    409
  );
}
