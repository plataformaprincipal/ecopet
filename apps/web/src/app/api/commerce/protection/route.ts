import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { getCatalogBySku } from "@/lib/pricing/catalog";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sku: z.string().regex(/^PRT-/),
  petId: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const rows = await prisma.protectionEnrollment.findMany({
    where: { userId: user!.id },
    include: { claims: true },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess({ enrollments: rows, splitReady: false, eccopetAssumesRisk: false });
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "SKU PRT inválido.", 400);
  const item = getCatalogBySku(parsed.data.sku);
  if (!item) return apiFailure("SKU_UNKNOWN", "SKU não encontrado no PFO.", 404);
  const enrollment = await prisma.protectionEnrollment.create({
    data: {
      userId: user!.id,
      petId: parsed.data.petId ?? null,
      sku: parsed.data.sku,
      status: "PENDING_PARTNER",
      amountCents: item.amountCents ?? 0,
      coverageJson: { note: "Cobertura indisponível até operador autorizado." },
      exclusionsJson: { note: "EccoPet não assume risco securitário." },
    },
  });
  return apiSuccess({ enrollment, status: "PARTNER_REQUIRED" });
}
