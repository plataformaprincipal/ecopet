import { GestorSectionPanel } from "@/components/features/gestor-admin/gestor-section-panel";

const pages = [
  { path: "orders", title: "Pedidos", exportType: "orders" },
  { path: "products", title: "Produtos", exportType: "products" },
  { path: "services", title: "Serviços", exportType: "services" },
  { path: "appointments", title: "Agendamentos", exportType: "appointments" },
  { path: "social", title: "Social", exportType: "social", showFilters: false },
  { path: "moderation", title: "Moderação", exportType: "moderation" },
  { path: "support", title: "Suporte", exportType: "support" },
  { path: "messages", title: "Mensagens", exportType: undefined },
  { path: "integrations", title: "Integrações", showFilters: false },
  { path: "finance", title: "Financeiro", exportType: "orders" },
  { path: "audit", title: "Auditoria", exportType: "audit" },
  { path: "quality", title: "Qualidade operacional", showFilters: false },
  { path: "system-health", title: "Saúde do sistema", showFilters: false },
] as const;

export function gestorPage(path: string) {
  const cfg = pages.find((p) => p.path === path);
  if (!cfg) return null;
  return (
    <GestorSectionPanel
      title={cfg.title}
      endpoint={cfg.path}
      exportType={"exportType" in cfg ? cfg.exportType : undefined}
      showFilters={"showFilters" in cfg ? cfg.showFilters !== false : true}
    />
  );
}
