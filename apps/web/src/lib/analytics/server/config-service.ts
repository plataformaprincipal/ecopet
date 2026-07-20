import "server-only";

import { detectAnalyticsEnvironment, getAnalyticsSanitizedStatus } from "../config";
import { getGaDataApiConfig } from "@/lib/admin/bi/ga-data-client";
import { getOrCreateOpsState, updateOpsState } from "./repository";
import type { AnalyticsConfigFlags } from "./types";
import { countCatalogEvents } from "../events/catalog";

export async function getAnalyticsServerConfig() {
  const [ops, tracking, dataApi] = await Promise.all([
    getOrCreateOpsState(),
    Promise.resolve(getAnalyticsSanitizedStatus()),
    Promise.resolve(getGaDataApiConfig()),
  ]);

  return {
    provider: "google_analytics",
    environment: detectAnalyticsEnvironment(),
    trackingStatus: tracking.status,
    measurementIdMasked: tracking.measurementIdMasked,
    dataApiConfigured: dataApi.configured,
    propertyIdMasked: dataApi.propertyIdMasked,
    configFlags: {
      debugLogging: Boolean(ops.configFlags.debugLogging),
      cacheTtlSec: ops.configFlags.cacheTtlSec ?? 45,
      healthJobsEnabled: Boolean(ops.configFlags.healthJobsEnabled),
    } satisfies AnalyticsConfigFlags,
    catalogEventCount: ops.catalogEventCount ?? countCatalogEvents(),
    notes: [
      "Measurement ID e service account nunca são retornados.",
      "Flags afetam apenas ops internas (cache/logs/jobs).",
      "Eventos de produto ficam no Google Analytics.",
    ],
  };
}

export async function patchAnalyticsServerConfig(
  flags: AnalyticsConfigFlags,
  updatedById: string
) {
  const ops = await getOrCreateOpsState();
  const merged: AnalyticsConfigFlags = {
    ...ops.configFlags,
    ...flags,
  };
  const updated = await updateOpsState({
    configFlags: merged,
    updatedById,
    environment: detectAnalyticsEnvironment(),
  });
  return {
    configFlags: updated.configFlags,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
