import type { LucideIcon } from "lucide-react";

/** Três categorias principais do ecossistema ECOPET */
export type ProfileCategory = "CLIENT" | "PARTNER" | "NGO";

/** Subtipos de parceiro (plataforma empresarial) */
export type PartnerSubtype =
  | "PETSHOP"
  | "VETERINARIAN"
  | "CLINIC"
  | "SELLER"
  | "SERVICE_PROVIDER"
  | "COMPANY"
  | "DISTRIBUTOR"
  | "AGRO"
  | "FRANCHISE"
  | "MARKETPLACE";

export interface ProfileMetric {
  label: string;
  value: string | number;
  trend?: string;
  variant?: "default" | "success" | "warning" | "critical";
}

export interface ProfileModule {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
  group?: string;
}

export interface SmartProfileData {
  category: ProfileCategory;
  partnerSubtype?: PartnerSubtype;
  name: string;
  coverImage: string;
  avatar: string;
  bio: string;
  location: string;
  subtitle: string;
  isVerified: boolean;
  isPremium: boolean;
  metrics: ProfileMetric[];
  badges: string[];
  modules: ProfileModule[];
}

export interface ProfileInsight {
  id: string;
  title: string;
  description: string;
  tag?: string;
  href?: string;
  action?: string;
  priority?: "low" | "medium" | "high";
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface WidgetItem {
  id: string;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: string;
  href?: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  status: "connected" | "pending" | "disconnected";
  lastSync?: string;
  icon?: string;
}

export interface ProfileListItem {
  label: string;
  value: string;
  href?: string;
  badge?: string;
}
