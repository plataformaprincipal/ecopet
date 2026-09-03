import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";
import { claimCase } from "@/lib/commerce-catalog/health-cases";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await context.params;
  try {
    const row = await claimCase({ caseId: id, professionalUserId: user!.id });
    return apiSuccess({ case: row });
  } catch (e) {
    if (e instanceof CatalogCommerceError) return apiFailure(e.code, e.message, e.status);
    return apiFailure("ERROR", "Falha ao assumir o caso.", 500);
  }
}
