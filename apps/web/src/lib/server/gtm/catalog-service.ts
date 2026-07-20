import "server-only";

import { listAllEventDefinitions } from "@/lib/analytics/events/catalog";
import { getInstrumentationCoverage } from "@/lib/gtm/coverage";
import { GTM_EVENT_VERSION } from "@/lib/gtm/contract";
import { isTransactionalEventName } from "./types";

export type GtmCatalogEventRow = {
  name: string;
  module: string;
  category: string;
  version: number;
  ga4Recommended: boolean;
  requiresConsent: boolean;
  transactional: boolean;
  deduplicationRequired: boolean;
  active: boolean;
  instrumented: boolean;
  surface?: string;
};

const GA4_RECOMMENDED = new Set([
  "login",
  "sign_up",
  "search",
  "view_item",
  "add_to_cart",
  "remove_from_cart",
  "begin_checkout",
  "purchase",
  "share",
  "generate_lead",
]);

export function getGtmEventCatalog(filters?: {
  module?: string;
  transactional?: boolean;
  instrumented?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const coverage = getInstrumentationCoverage(
    listAllEventDefinitions().map((d) => d.event_name)
  );
  const byName = new Map(
    coverage.implemented.map((i) => [i.event_name, i] as const)
  );

  let rows: GtmCatalogEventRow[] = listAllEventDefinitions().map((d) => {
    const inst = byName.get(d.event_name);
    const transactional = isTransactionalEventName(d.event_name);
    return {
      name: d.event_name,
      module: d.module,
      category: d.category,
      version: GTM_EVENT_VERSION,
      ga4Recommended: GA4_RECOMMENDED.has(d.event_name),
      requiresConsent: true,
      transactional,
      deduplicationRequired: transactional,
      active: true,
      instrumented: Boolean(inst),
      surface: inst?.surface,
    };
  });

  if (filters?.module) {
    rows = rows.filter((r) => r.module === filters.module);
  }
  if (filters?.transactional != null) {
    rows = rows.filter((r) => r.transactional === filters.transactional);
  }
  if (filters?.instrumented != null) {
    rows = rows.filter((r) => r.instrumented === filters.instrumented);
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter(
      (r) => r.name.includes(q) || r.module.includes(q) || r.category.includes(q)
    );
  }

  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 25));
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return {
    total,
    page,
    pageSize,
    items,
    contractVersion: GTM_EVENT_VERSION,
    coveragePct: coverage.coveragePct,
  };
}
