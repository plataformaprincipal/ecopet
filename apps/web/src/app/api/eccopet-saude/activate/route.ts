import { z } from "zod";
import { apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { quoteEccoPetSaudeTier, type EccoPetSaudeTierId } from "@/lib/eccopet-saude/plans";

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

  return apiFailure(
    "PARTNER_REQUIRED",
    "Planos de saúde PRT exigem operador autorizado. A EccoPet não vende cobertura própria. Use /marketplace/saude/planos.",
    409
  );
}
