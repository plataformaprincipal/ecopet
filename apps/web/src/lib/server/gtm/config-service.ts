import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GTM_OPS_PROVIDER } from "@/lib/admin/gtm-governance/ops-repository";
import {
  GTM_CONTRACT_VERSION,
  type GtmOpsConfigFlags,
} from "./types";
import { gtmGovCacheClear } from "@/lib/admin/gtm-governance/cache";

const DEFAULTS: Required<GtmOpsConfigFlags> = {
  collectionEnabled: true,
  debugEnabled: false,
  consentRequired: true,
  eventContractVersion: GTM_CONTRACT_VERSION,
  diagnosticLevel: "basic",
  allowProductionTest: false,
};

function parseFlags(raw: unknown): GtmOpsConfigFlags {
  if (!raw || typeof raw !== "object") return {};
  return raw as GtmOpsConfigFlags;
}

export async function getGtmOpsConfig(): Promise<{
  flags: Required<GtmOpsConfigFlags>;
  updatedAt: string | null;
  updatedById: string | null;
}> {
  const row = await prisma.analyticsOpsState.findUnique({
    where: { provider: GTM_OPS_PROVIDER },
  });
  const flags = { ...DEFAULTS, ...parseFlags(row?.configFlags) };
  return {
    flags,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
    updatedById: row?.updatedById ?? null,
  };
}

export async function patchGtmOpsConfig(
  patch: GtmOpsConfigFlags,
  updatedById: string
): Promise<Required<GtmOpsConfigFlags>> {
  const current = await getGtmOpsConfig();
  const next: Required<GtmOpsConfigFlags> = {
    ...current.flags,
    ...patch,
    eventContractVersion: GTM_CONTRACT_VERSION,
  };
  if (patch.diagnosticLevel && !["basic", "full"].includes(patch.diagnosticLevel)) {
    throw new Error("INVALID_DIAGNOSTIC_LEVEL");
  }

  await prisma.analyticsOpsState.upsert({
    where: { provider: GTM_OPS_PROVIDER },
    create: {
      provider: GTM_OPS_PROVIDER,
      status: "READY",
      configFlags: next as unknown as Prisma.InputJsonValue,
      updatedById,
    },
    update: {
      configFlags: next as unknown as Prisma.InputJsonValue,
      updatedById,
    },
  });
  gtmGovCacheClear();
  return next;
}
