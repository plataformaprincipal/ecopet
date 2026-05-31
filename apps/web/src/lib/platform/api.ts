import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function token() {
  return useAppStore.getState().apiToken ?? undefined;
}

export async function fetchPlatformExecutive(persona?: string) {
  return api(`/api/platform/executive${persona ? `?persona=${persona}` : ""}`, { token: token() });
}

export async function fetchWorkflowById(id: string) {
  return api(`/api/platform/workflows/${id}`, { token: token() });
}

export async function updateWorkflow(id: string, data: Record<string, unknown>) {
  return api(`/api/platform/workflows/${id}`, { method: "PUT", token: token(), body: JSON.stringify(data) });
}

export async function createContentReport(data: { targetType: string; targetId: string; reason: string; description?: string }) {
  return api("/api/moderation/reports", { method: "POST", token: token(), body: JSON.stringify(data) });
}

export async function fetchWorkflows(scope?: string) {
  return api(`/api/platform/workflows${scope ? `?scope=${scope}` : ""}`, { token: token() });
}

export async function createWorkflow(data: Record<string, unknown>) {
  return api("/api/platform/workflows", { method: "POST", token: token(), body: JSON.stringify(data) });
}

export async function runWorkflow(id: string) {
  return api(`/api/platform/workflows/${id}/run`, { method: "POST", token: token(), body: JSON.stringify({}) });
}

export async function fetchSlaDashboard() {
  return api("/api/platform/sla", { token: token() });
}

export async function fetchBusinessRules(scope?: string) {
  return api(`/api/platform/rules${scope ? `?scope=${scope}` : ""}`, { token: token() });
}

export async function fetchPlatformEvents(scope?: string) {
  return api(`/api/platform/events${scope ? `?scope=${scope}` : ""}`, { token: token() });
}

export async function fetchIntelligence(scope?: string) {
  return api(`/api/platform/intelligence${scope ? `?scope=${scope}` : ""}`, { token: token() });
}

export async function fetchCostDashboard() {
  return api("/api/platform/costs", { token: token() });
}

export async function fetchDataLayer() {
  return api("/api/platform/data-layer", { token: token() });
}

export async function fetchObservability() {
  return api("/api/platform/observability", { token: token() });
}

export async function fetchBackups() {
  return api("/api/platform/backups", { token: token() });
}

export async function triggerBackup(type = "manual") {
  return api("/api/platform/backups", { method: "POST", token: token(), body: JSON.stringify({ type }) });
}

export async function fetchFeatureFlags(scope?: string) {
  return api(`/api/platform/features${scope ? `?scope=${scope}` : ""}`, { token: token() });
}

export async function toggleFeatureFlag(data: Record<string, unknown>) {
  return api("/api/platform/features", { method: "POST", token: token(), body: JSON.stringify(data) });
}

export async function fetchLgpdDashboard() {
  return api("/api/platform/lgpd", { token: token() });
}

export async function createLgpdRequest(type: string, notes?: string) {
  return api("/api/platform/lgpd/requests", { method: "POST", token: token(), body: JSON.stringify({ type, notes }) });
}

export async function recordConsent(consentType: string, granted: boolean) {
  return api("/api/platform/lgpd/consent", { method: "POST", token: token(), body: JSON.stringify({ consentType, granted }) });
}

export async function fetchOrganizations(type?: string) {
  return api(`/api/platform/organizations${type ? `?type=${type}` : ""}`, { token: token() });
}

export async function seedPlatformInfra() {
  return api("/api/platform/seed", { method: "POST", token: token() });
}

export interface PlatformMetrics {
  metrics: { label: string; value: number | string; suffix?: string }[];
  aiInsights?: { title: string; description: string; priority: string }[];
}
