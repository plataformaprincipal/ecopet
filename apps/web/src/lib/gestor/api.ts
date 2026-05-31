import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function token() {
  return useAppStore.getState().apiToken ?? undefined;
}

export interface GestorDashboardMetrics {
  revenue: { total: number; recurring: number };
  wallet?: { totalBalance: number };
  users: { total: number; newThisWeek: number; activeClients?: number };
  partners: { active: number };
  ngos: { active: number };
  pets: { total: number };
  marketplace: { products: number; services: number; orders: number; quotes?: number };
  operations: {
    pendingApprovals: number; openTickets: number; pendingReports: number; hiddenPosts: number;
    openChats?: number; errorIntegrations?: number; activeRobots?: number;
  };
  social: { posts: number; engagement: number; retention?: number };
  integrations: { active: number; errors?: number };
  growth?: { weekly: number; marketplaceOrders: number };
  aiInsights: { id: string; tag: string; title: string; description?: string; priority: string }[];
}

export async function fetchGestorModule(moduleId: string) {
  return api<Record<string, unknown>>(`/api/gestor/modules/${moduleId}`, { token: token() });
}

export async function fetchInternalUsers() {
  return api("/api/gestor/users/internal", { token: token() });
}

export async function fetchGestorInvites() {
  return api("/api/gestor/invites", { token: token() });
}

export async function createGestorInvite(data: { email: string; name: string; roleCode: string; departmentId?: string }) {
  return api("/api/gestor/invites", { method: "POST", token: token(), body: JSON.stringify(data) });
}

export async function dispatchNotification(data: { title: string; body: string; channel: string; segment?: string }) {
  return api("/api/gestor/notifications/dispatch", { method: "POST", token: token(), body: JSON.stringify(data) });
}

export async function exportAuditLogs() {
  return api("/api/gestor/audit/export", { token: token() });
}

export async function fetchLoginLogs() {
  return api("/api/gestor/login-logs", { token: token() });
}

export async function fetchSystemHealth() {
  return api("/api/gestor/system/health", { method: "POST", token: token() });
}

export async function fetchGestorDashboard() {
  return api<GestorDashboardMetrics>("/api/gestor/dashboard", { token: token() });
}

export async function fetchApprovals(status?: string) {
  const q = status ? `?status=${status}` : "";
  return api<ApprovalRequest[]>(`/api/gestor/approvals${q}`, { token: token() });
}

export async function reviewApproval(id: string, status: "APPROVED" | "REJECTED" | "REVISION", notes?: string) {
  return api(`/api/gestor/approvals/${id}`, {
    method: "PATCH",
    token: token(),
    body: JSON.stringify({ status, notes }),
  });
}

export async function fetchAuditLogs(module?: string) {
  const q = module ? `?module=${module}` : "";
  return api<AuditLogEntry[]>(`/api/gestor/audit${q}`, { token: token() });
}

export async function fetchGestorTickets() {
  return api<SupportTicket[]>(`/api/gestor/tickets`, { token: token() });
}

export async function fetchModerationReports() {
  return api<ContentReport[]>(`/api/gestor/moderation/reports`, { token: token() });
}

export async function resolveReport(id: string, action: string, status: "RESOLVED" | "DISMISSED") {
  return api(`/api/gestor/moderation/reports/${id}`, {
    method: "PATCH",
    token: token(),
    body: JSON.stringify({ action, status }),
  });
}

export async function fetchMyPermissions() {
  return api<{ permissions: string[]; role: string }>("/api/gestor/permissions/me", { token: token() });
}

export async function fetchRbacRoles() {
  return api("/api/gestor/rbac/roles", { token: token() });
}

export async function fetchConversations() {
  return api("/api/conversations", { token: token() });
}

export async function fetchConversationMessages(conversationId: string) {
  return api(`/api/conversations/${conversationId}/messages`, { token: token() });
}

export async function sendConversationMessage(conversationId: string, content: string) {
  return api(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    token: token(),
    body: JSON.stringify({ content, type: "TEXT" }),
  });
}

export async function openEcopetSupport() {
  return api("/api/conversations/support/ecopet", { method: "POST", token: token() });
}

export interface ApprovalRequest {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  status: string;
  aiRiskScore?: number;
  aiNotes?: string;
  notes?: string;
  createdAt: string;
  requester: { id: string; name: string; email: string; role: string };
  reviewer?: { id: string; name: string };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  module: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actor?: { id: string; name: string; email: string; role: string };
}

export interface SupportTicket {
  id: string;
  number: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  requester: { id: string; name: string; email: string; role: string };
  assignee?: { id: string; name: string };
}

export interface ContentReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string };
}
