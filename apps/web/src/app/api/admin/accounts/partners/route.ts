import { AccountStatus } from "@prisma/client";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listPartnersByStatus } from "@/lib/admin/accounts-service";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && Object.values(AccountStatus).includes(statusParam as AccountStatus)
      ? (statusParam as AccountStatus)
      : AccountStatus.PENDING;

  const partners = await listPartnersByStatus(status);
  return apiSuccess({ partners, status, total: partners.length });
}
