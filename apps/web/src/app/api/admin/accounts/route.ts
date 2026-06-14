import { AccountStatus } from "@prisma/client";
import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  listPendingOngs,
  listPendingPartners,
} from "@/lib/admin/accounts-service";

export async function GET() {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const [partners, ongs] = await Promise.all([listPendingPartners(), listPendingOngs()]);

  return apiSuccess({
    summary: {
      pendingPartners: partners.length,
      pendingOngs: ongs.length,
    },
    partners,
    ongs,
    reviewedBy: user!.id,
  });
}
