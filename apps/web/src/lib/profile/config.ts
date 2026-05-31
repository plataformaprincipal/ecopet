import {
  LayoutDashboard, Users, PawPrint, Sparkles, Wallet, Calendar, Settings,
  BarChart3, DollarSign, FileText, Scale, Megaphone, Building2, Package,
  Clock, UserCog, Cpu, Lightbulb, Plug, Heart, Shield, Search, Stethoscope,
  HandHeart, AlertTriangle, BookOpen, MessageCircle, TrendingUp, Sprout, Bot,
  ShoppingBag, FileCheck, Truck, Star,
} from "lucide-react";
import type { ProfileCategory, ProfileModule } from "./types";

export const CLIENT_MODULES: ProfileModule[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, group: "Principal" },
  { id: "dashboard", label: "Painel funcional", icon: ShoppingBag, group: "Principal" },
  { id: "social", label: "Área Social", icon: MessageCircle, group: "Social" },
  { id: "pets", label: "Central Pet", icon: PawPrint, group: "Pet" },
  { id: "quotes", label: "Orçamentos", icon: FileCheck, group: "Marketplace" },
  { id: "chats", label: "Chats", icon: MessageCircle, group: "Marketplace" },
  { id: "intelligent", label: "Painel Inteligente", icon: Sparkles, badge: "IA", group: "IA" },
  { id: "insights", label: "Métricas", icon: BarChart3, group: "IA" },
  { id: "financial", label: "Financeiro", icon: Wallet, group: "Financeiro" },
  { id: "services", label: "Serviços", icon: Calendar, group: "Serviços" },
  { id: "integrations", label: "Integrações", icon: Plug, group: "Ecossistema" },
  { id: "robots24h", label: "Robôs 24h", icon: Bot, badge: "24h", group: "Ecossistema" },
  { id: "privacy", label: "Privacidade & LGPD", icon: Shield, group: "Conta" },
  { id: "workflows", label: "Automações", icon: Bot, group: "Ecossistema" },
  { id: "settings", label: "Seus Dados", icon: Settings, group: "Conta" },
];

export const PARTNER_MODULES: ProfileModule[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, group: "Executivo" },
  { id: "products", label: "Produtos", icon: Package, group: "Marketplace" },
  { id: "services", label: "Serviços", icon: Stethoscope, group: "Marketplace" },
  { id: "quotes", label: "Orçamentos", icon: FileCheck, group: "Marketplace" },
  { id: "quality", label: "Qualidade", icon: Star, group: "Operações" },
  { id: "chats", label: "Chats", icon: MessageCircle, group: "Atendimento" },
  { id: "access", label: "Equipe & Acessos", icon: Users, group: "Pessoas" },
  { id: "suppliers", label: "Fornecedores", icon: Truck, group: "Operações" },
  { id: "insights", label: "Métricas", icon: BarChart3, group: "Executivo" },
  { id: "bi", label: "BI & Analytics", icon: TrendingUp, group: "Executivo" },
  { id: "financial", label: "Financeiro", icon: DollarSign, group: "Financeiro" },
  { id: "accounting", label: "Contábil", icon: FileText, group: "Financeiro" },
  { id: "legal", label: "Jurídico", icon: Scale, group: "Compliance" },
  { id: "marketing", label: "Marketing", icon: Megaphone, group: "Growth" },
  { id: "admin", label: "Administrativo", icon: Building2, group: "Operações" },
  { id: "stock", label: "Estoque", icon: Package, group: "Operações" },
  { id: "agenda", label: "Agenda", icon: Clock, group: "Operações" },
  { id: "rh", label: "RH", icon: UserCog, group: "Pessoas" },
  { id: "ti", label: "TI", icon: Cpu, group: "Tecnologia" },
  { id: "innovation", label: "Inovação", icon: Lightbulb, group: "Tecnologia" },
  { id: "agropet", label: "AGROPET", icon: Sprout, badge: "Agro", group: "Negócios" },
  { id: "assessoria", label: "Assessoria Inteligente", icon: Sparkles, badge: "Premium", group: "Executivo" },
  { id: "integrations", label: "Integrações", icon: Plug, group: "Ecossistema" },
  { id: "robots24h", label: "Robôs 24h", icon: Bot, badge: "24h", group: "Ecossistema" },
  { id: "privacy", label: "Privacidade & LGPD", icon: Shield, group: "Compliance" },
  { id: "workflows", label: "Automações", icon: Bot, group: "Operações" },
  { id: "monitoring", label: "Monitoramento", icon: BarChart3, group: "Tecnologia" },
  { id: "ai", label: "Central IA", icon: Sparkles, badge: "IA", group: "IA" },
];

export const NGO_MODULES: ProfileModule[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, group: "Principal" },
  { id: "dashboard", label: "Painel funcional", icon: Heart, group: "Principal" },
  { id: "social", label: "Área Social", icon: Heart, group: "Social" },
  { id: "chats", label: "Chats", icon: MessageCircle, group: "Comunicação" },
  { id: "insights", label: "Métricas", icon: BarChart3, group: "Transparência" },
  { id: "access", label: "Níveis de acesso", icon: Users, group: "Governança" },
  { id: "rescue", label: "Resgate", icon: Shield, group: "Operacional" },
  { id: "donations", label: "Doações", icon: HandHeart, group: "Financeiro" },
  { id: "operations", label: "Operacional", icon: Building2, group: "Operacional" },
  { id: "assessoria", label: "Assessoria Inteligente", icon: Sparkles, badge: "Premium", group: "Governança" },
  { id: "integrations", label: "Integrações", icon: Plug, group: "Ecossistema" },
  { id: "robots24h", label: "Robôs 24h", icon: Bot, badge: "24h", group: "Ecossistema" },
  { id: "privacy", label: "Transparência & LGPD", icon: Shield, group: "Governança" },
  { id: "workflows", label: "Automações", icon: Bot, group: "Operacional" },
  { id: "monitoring", label: "Monitoramento", icon: BarChart3, group: "Transparência" },
  { id: "ai", label: "IA Social", icon: Sparkles, badge: "IA", group: "IA" },
];

export const MODULES_BY_CATEGORY: Record<ProfileCategory, ProfileModule[]> = {
  CLIENT: CLIENT_MODULES,
  PARTNER: PARTNER_MODULES,
  NGO: NGO_MODULES,
};

export const MODULE_ICONS = {
  Search, Stethoscope, TrendingUp, AlertTriangle, BookOpen, Users,
};
