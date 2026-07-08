import { prisma } from "@/lib/prisma";
import { auditPermissionChange } from "@/lib/auth/auth-audit";

const SETTINGS_ID = "singleton";

export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });
}

export type PlatformSettingsInput = {
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  institutionalText?: string | null;
  supportEmail?: string | null;
  contactEmail?: string | null;
  marketplaceEnabled?: boolean;
};

export async function updatePlatformSettings(adminId: string, input: PlatformSettingsInput) {
  const before = await getPlatformSettings();

  const updated = await prisma.platformSettings.update({
    where: { id: SETTINGS_ID },
    data: {
      ...(input.maintenanceMode !== undefined ? { maintenanceMode: input.maintenanceMode } : {}),
      ...(input.maintenanceMessage !== undefined ? { maintenanceMessage: input.maintenanceMessage } : {}),
      ...(input.institutionalText !== undefined ? { institutionalText: input.institutionalText } : {}),
      ...(input.supportEmail !== undefined ? { supportEmail: input.supportEmail } : {}),
      ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
      ...(input.marketplaceEnabled !== undefined ? { marketplaceEnabled: input.marketplaceEnabled } : {}),
      updatedById: adminId,
    },
  });

  await auditPermissionChange({
    actorId: adminId,
    resourceId: SETTINGS_ID,
    before,
    after: updated,
    observation: "Atualização de configurações da plataforma",
  });

  return updated;
}
