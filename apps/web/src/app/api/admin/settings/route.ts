import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/admin/settings-service";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const settings = await getPlatformSettings();
  return apiSuccess({ settings });
}

const updateSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(2000).nullable().optional(),
  institutionalText: z.string().max(10000).nullable().optional(),
  supportEmail: z.string().email().nullable().optional().or(z.literal("")),
  contactEmail: z.string().email().nullable().optional().or(z.literal("")),
  marketplaceEnabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const data = {
    ...parsed.data,
    supportEmail: parsed.data.supportEmail === "" ? null : parsed.data.supportEmail,
    contactEmail: parsed.data.contactEmail === "" ? null : parsed.data.contactEmail,
  };

  const settings = await updatePlatformSettings(user!.id, data);
  return apiSuccess({ settings, message: "Configurações salvas." });
}
