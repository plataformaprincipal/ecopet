import type { ChartDataPoint, ProfileInsight } from "../types";

type ProfileListItem = { label: string; value: string; badge?: string; href?: string };
type ExecutiveMetric = { label: string; value: string | number; trend?: string };

export const PARTNER_PROFILES = {
  PETSHOP: { name: "", avatar: "", coverImage: "", bio: "", location: "", subtitle: "" },
  SELLER: { name: "", avatar: "", coverImage: "", bio: "", location: "", subtitle: "" },
  CLINIC: { name: "", avatar: "", coverImage: "", bio: "", location: "", subtitle: "" },
  SERVICE_PROVIDER: { name: "", avatar: "", coverImage: "", bio: "", location: "", subtitle: "" },
};

export const PARTNER_SALES_CHART: ChartDataPoint[] = [];
export const PARTNER_PRODUCTS: never[] = [];
export const PARTNER_SERVICES: never[] = [];
export const PARTNER_TEAM: never[] = [];
export const PARTNER_EXECUTIVE_METRICS: ExecutiveMetric[] = [];
export const PARTNER_FINANCIAL: ProfileListItem[] = [];
export const PARTNER_ACCOUNTING: ProfileListItem[] = [];
export const PARTNER_LEGAL: ProfileListItem[] = [];
export const PARTNER_MARKETING: ProfileListItem[] = [];
export const PARTNER_STOCK: ProfileListItem[] = [];
export const PARTNER_RH: ProfileListItem[] = [];
export const PARTNER_AI_INSIGHTS: ProfileInsight[] = [];
export const PARTNER_BI_CHARTS = {
  clients: [] as ChartDataPoint[],
  satisfaction: [] as ChartDataPoint[],
  churn: [] as ChartDataPoint[],
};
