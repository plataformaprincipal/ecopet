import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { getPartnerMpConnectionView, startPartnerMpOAuth } from "@/lib/mercado-pago/partner-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const connection = await getPartnerMpConnectionView(user!.id);
  return apiSuccess({ connection });
}

export async function POST() {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const started = await startPartnerMpOAuth(user!.id);
  if (!started.ok) return apiFailure(started.code, started.message, 409);
  return apiSuccess({ authorizationUrl: started.url, status: "PENDING" });
}
