import type { GestorReportType } from "@/lib/gestor/gestor.types";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { getGestorUsers, getGestorPartners, getGestorOngs } from "@/lib/gestor/gestor-users-service";
import {
  getGestorProducts,
  getGestorServices,
  getGestorOrders,
  getGestorAppointments,
} from "@/lib/gestor/gestor-marketplace-service";
import { getGestorSocial, getGestorModeration, getGestorAudit } from "@/lib/gestor/gestor-social-service";
import { getGestorSupport, getGestorIntegrations } from "@/lib/gestor/gestor-support-service";

export const REPORT_TYPES: GestorReportType[] = [
  "users",
  "partners",
  "ongs",
  "products",
  "services",
  "orders",
  "appointments",
  "social",
  "moderation",
  "support",
  "integrations",
  "audit",
];

export async function getGestorReport(type: GestorReportType, filters: GestorFilters) {
  switch (type) {
    case "users":
      return getGestorUsers(filters);
    case "partners":
      return getGestorPartners(filters);
    case "ongs":
      return getGestorOngs(filters);
    case "products":
      return getGestorProducts(filters);
    case "services":
      return getGestorServices(filters);
    case "orders":
      return getGestorOrders(filters);
    case "appointments":
      return getGestorAppointments(filters);
    case "social":
      return getGestorSocial(filters);
    case "moderation":
      return getGestorModeration(filters);
    case "support":
      return getGestorSupport(filters);
    case "integrations":
      return getGestorIntegrations();
    case "audit":
      return getGestorAudit(filters);
    default:
      throw new Error("INVALID_REPORT_TYPE");
  }
}

export async function listGestorReportsMeta() {
  return {
    types: REPORT_TYPES.map((t) => ({ type: t, label: t })),
    maxExportRows: 500,
    formats: ["csv"],
  };
}
