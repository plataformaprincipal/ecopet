import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function token() {
  return useAppStore.getState().apiToken ?? undefined;
}

export interface AdvisoryRobot {
  domain: string;
  name: string;
  description: string;
  status: string;
}

export interface AdvisoryCard {
  key: string;
  label: string;
  value: number;
  trend?: string;
}

export interface AdvisoryInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  actionPlan?: { steps: string[]; robot: string };
}

export interface AdvisoryDashboard {
  robots: AdvisoryRobot[];
  cards: AdvisoryCard[];
  planType: string;
  subscription: { active: boolean; insights: AdvisoryInsight[] };
}

export async function fetchAdvisoryDashboard() {
  return api<AdvisoryDashboard>("/api/advisory/dashboard", { token: token() });
}

export async function fetchAdvisoryRobots() {
  return api<AdvisoryRobot[]>("/api/advisory/robots", { token: token() });
}

export async function fetchAdvisoryInsights() {
  return api<AdvisoryInsight[]>("/api/advisory/insights", { token: token() });
}

export async function generateAdvisoryInsights() {
  return api<AdvisoryInsight[]>("/api/advisory/insights/generate", {
    method: "POST",
    token: token(),
  });
}

export async function fetchAdvisoryMarketplace() {
  return api<{ id: string; name: string; category: string; price: number }[]>(
    "/api/advisory/marketplace",
    { token: token() }
  );
}
