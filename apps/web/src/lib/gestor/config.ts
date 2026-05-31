import {
  LayoutDashboard, CheckCircle, MessageCircle, Shield, DollarSign,
  BarChart3, Megaphone, Scale, Users, Cpu, Lightbulb, Plug, Star,
  FileText, Palette, FolderKanban, Bot, Settings, Bell, FileStack,
  Building2, Headphones, AlertTriangle, Radio, Activity, Briefcase,
  Lock, Server, LineChart, Timer, Zap, Database, Flag,
  Eye, HardDrive, BookOpen, Brain, Workflow,
} from "lucide-react";

export const GESTOR_MODULES = [
  { id: "dashboard", label: "Dashboard Executivo", icon: LayoutDashboard, group: "Executivo", permission: "gestor.dashboard.view", href: "/gestor" },
  { id: "approvals", label: "Cadastro & Aprovações", icon: CheckCircle, group: "Operações", permission: "gestor.approvals.view", href: "/gestor/approvals" },
  { id: "parceiros", label: "Parceiros", icon: Briefcase, group: "Operações", permission: "gestor.approvals.view", href: "/gestor/parceiros" },
  { id: "denuncias", label: "Denúncias & Moderação", icon: AlertTriangle, group: "Social", permission: "gestor.moderation.view", href: "/gestor/denuncias" },
  { id: "social", label: "Rede Social", icon: MessageCircle, group: "Social", permission: "gestor.moderation.view", href: "/gestor/social" },
  { id: "marketplace", label: "Marketplace", icon: Star, group: "Marketplace", permission: "gestor.marketplace.view", href: "/gestor/marketplace" },
  { id: "chats", label: "Chats", icon: MessageCircle, group: "Atendimento", permission: "gestor.support.view", href: "/gestor/chats" },
  { id: "support", label: "Suporte & Tickets", icon: Headphones, group: "Atendimento", permission: "gestor.support.view", href: "/gestor/support" },
  { id: "notificacoes", label: "Notificações Globais", icon: Bell, group: "Comunicação", permission: "gestor.marketing.view", href: "/gestor/notificacoes" },
  { id: "financeiro", label: "Financeiro ECOPET", icon: DollarSign, group: "Financeiro", permission: "gestor.finance.view", href: "/gestor/financeiro" },
  { id: "contabil", label: "Contábil", icon: FileText, group: "Financeiro", permission: "gestor.finance.view", href: "/gestor/contabil" },
  { id: "marketing", label: "Marketing", icon: Megaphone, group: "Growth", permission: "gestor.marketing.view", href: "/gestor/marketing" },
  { id: "vendas", label: "Vendas", icon: BarChart3, group: "Comercial", permission: "gestor.marketplace.view", href: "/gestor/vendas" },
  { id: "qualidade", label: "Controle de Qualidade", icon: Shield, group: "Qualidade", permission: "gestor.quality.view", href: "/gestor/qualidade" },
  { id: "design", label: "Design & Assets", icon: Palette, group: "Design", permission: "gestor.marketing.view", href: "/gestor/design" },
  { id: "projetos", label: "Novos Projetos", icon: FolderKanban, group: "Inovação", permission: "gestor.dashboard.view", href: "/gestor/projetos" },
  { id: "empresa", label: "Empresa ECOPET", icon: Building2, group: "Interno", permission: "gestor.dashboard.view", href: "/gestor/empresa" },
  { id: "administrativo", label: "Administrativo", icon: FileStack, group: "Interno", permission: "gestor.dashboard.view", href: "/gestor/administrativo" },
  { id: "ti", label: "TI & Monitoramento", icon: Cpu, group: "Tecnologia", permission: "gestor.ti.admin", href: "/gestor/ti" },
  { id: "inovacao", label: "Inovação & Lab", icon: Lightbulb, group: "Inovação", permission: "gestor.dashboard.view", href: "/gestor/inovacao" },
  { id: "juridico", label: "Jurídico & LGPD", icon: Scale, group: "Compliance", permission: "gestor.legal.view", href: "/gestor/juridico" },
  { id: "rh", label: "RH", icon: Users, group: "Pessoas", permission: "gestor.rh.view", href: "/gestor/rh" },
  { id: "documentos", label: "Documentos", icon: FileText, group: "Governança", permission: "gestor.approvals.view", href: "/gestor/documentos" },
  { id: "permissions", label: "Permissões & Acessos", icon: Lock, group: "Governança", permission: "gestor.permissions.view", href: "/gestor/permissions" },
  { id: "audit", label: "Auditoria Global", icon: FileText, group: "Governança", permission: "gestor.audit.view", href: "/gestor/audit" },
  { id: "integrations", label: "Integrações", icon: Plug, group: "Ecossistema", permission: "gestor.integrations.view", href: "/gestor/integrations" },
  { id: "robos", label: "Robôs 24h", icon: Bot, group: "Automação", permission: "gestor.dashboard.view", href: "/gestor/robos" },
  { id: "workflows", label: "Workflow Center", icon: Workflow, group: "Automação", permission: "gestor.workflow.view", href: "/gestor/workflows" },
  { id: "sla", label: "SLA Center", icon: Timer, group: "Automação", permission: "gestor.sla.view", href: "/gestor/sla" },
  { id: "rules", label: "Motor de Regras", icon: Zap, group: "Automação", permission: "gestor.rules.view", href: "/gestor/rules" },
  { id: "events", label: "Event Center", icon: Activity, group: "Dados", permission: "gestor.events.view", href: "/gestor/events" },
  { id: "intelligence", label: "EcoPet Intelligence", icon: Brain, group: "Dados", permission: "gestor.governance.view", href: "/gestor/intelligence" },
  { id: "costs", label: "Central de Custos", icon: DollarSign, group: "Financeiro", permission: "gestor.costs.view", href: "/gestor/costs" },
  { id: "data-layer", label: "Data Layer", icon: Database, group: "Dados", permission: "gestor.data.view", href: "/gestor/data-layer" },
  { id: "backups", label: "Backup Center", icon: HardDrive, group: "Sistema", permission: "gestor.backup.view", href: "/gestor/backups" },
  { id: "observability", label: "Observabilidade", icon: Eye, group: "Sistema", permission: "gestor.observability.view", href: "/gestor/observability" },
  { id: "features", label: "Feature Management", icon: Flag, group: "Sistema", permission: "gestor.flags.view", href: "/gestor/features" },
  { id: "governance", label: "Governança & Compliance", icon: BookOpen, group: "Governança", permission: "gestor.governance.view", href: "/gestor/governance" },
  { id: "iot", label: "IoT", icon: Radio, group: "Automação", permission: "gestor.ti.admin", href: "/gestor/iot" },
  { id: "bi", label: "BI & Dashboards", icon: LineChart, group: "Dados", permission: "gestor.dashboard.view", href: "/gestor/bi" },
  { id: "configuracoes", label: "Configurações", icon: Settings, group: "Sistema", permission: "gestor.permissions.admin", href: "/gestor/configuracoes" },
  { id: "sistema", label: "Sistema & Health", icon: Server, group: "Sistema", permission: "gestor.ti.admin", href: "/gestor/sistema" },
] as const;

export type GestorModuleId = (typeof GESTOR_MODULES)[number]["id"];

export function getGestorModuleHref(id: string) {
  return GESTOR_MODULES.find((m) => m.id === id)?.href ?? `/gestor/${id}`;
}
