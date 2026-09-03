import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { listLicensedProfessionals } from "@/lib/commerce-catalog/health-cases";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const professionals = await listLicensedProfessionals();
  return apiSuccess({
    professionals,
    partnerRequired: professionals.length === 0,
    disclaimer: "Somente profissionais com CRMV já cadastrado. Nenhum veterinário é inventado.",
  });
}
