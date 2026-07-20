import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { getBiDomainReport } from "@/lib/admin/bi/hub-service";

/**
 * BI Executivo ERP — delega ao Centro de Inteligência (first-party + GA).
 * Mantém compatibilidade com GET /api/admin/erp/bi.
 */
export async function getErpBiModule(filters: GestorFilters): Promise<ErpModuleResponse> {
  const report = await getBiDomainReport({
    domain: "executive",
    period: "30d",
    dateFrom: filters.dateFrom ?? null,
    dateTo: filters.dateTo ?? null,
    city: typeof filters.city === "string" ? filters.city : null,
    state: typeof filters.state === "string" ? filters.state : null,
  });

  return {
    ...report,
    moduleId: "bi",
    title: "Business Intelligence",
    tabs: [
      { id: "dashboard", label: "Dashboard" },
      { id: "charts", label: "Gráficos" },
      { id: "segmentation", label: "Segmentação" },
      { id: "forecast", label: "Previsões" },
    ],
    quickActions: [
      { label: "Centro de Inteligência", href: "/admin/bi" },
      { label: "Google Analytics", href: "/admin/bi/google-analytics" },
      { label: "Marketplace", href: "/admin/bi/marketplace" },
      { label: "Alertas", href: "/admin/bi/alertas" },
      { label: "Assistente IA", href: "/admin/assistente" },
    ],
  };
}
