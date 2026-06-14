import type { ChartDataPoint } from "@/lib/profile/types";
import type { ProfileCategory, Robot24h } from "./types";

export const EXTERNAL_INTEGRATIONS: never[] = [];
export const INTERNAL_INTEGRATIONS: never[] = [];
export const INTEGRATION_CATEGORIES: never[] = [];
export const AUTOMATION_LOGS: never[] = [];
export const AI_AUTOMATION_INSIGHTS: never[] = [];
export const SYNC_CHART: ChartDataPoint[] = [];
export const FAILURES_CHART: ChartDataPoint[] = [];
export const ROBOT_ACTIONS_CHART: ChartDataPoint[] = [];

export function getExternalForProfile(_profile: ProfileCategory) {
  return EXTERNAL_INTEGRATIONS;
}

export function getInternalForProfile(_profile: ProfileCategory) {
  return INTERNAL_INTEGRATIONS;
}

export function getDashboardStatsForProfile(_profile: ProfileCategory) {
  return {
    activeIntegrations: 0,
    errorIntegrations: 0,
    activeRobots: 0,
    criticalAlerts: 0,
    runningAutomations: 0,
    lastSync: "—",
    dataProcessed: "0",
    risksFound: 0,
  };
}

export function getRobotsForProfile(_profileId?: ProfileCategory): Robot24h[] {
  return [];
}
