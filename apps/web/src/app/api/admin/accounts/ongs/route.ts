import { AccountStatus } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listOngsByStatus } from "@/lib/admin/accounts-service";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && Object.values(AccountStatus).includes(statusParam as AccountStatus)
      ? (statusParam as AccountStatus)
      : AccountStatus.PENDING;

  const ongs = await listOngsByStatus(status);
  return apiSuccess({ ongs, status, total: ongs.length });
}
