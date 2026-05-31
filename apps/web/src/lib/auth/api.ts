import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function token() {
  return useAppStore.getState().apiToken ?? undefined;
}

export interface BootstrapStatus {
  initialized: boolean;
  bootstrapAvailable: boolean;
  masterAdminUserId?: string;
}

export interface PasswordPolicy {
  requiresEmailCode: boolean;
  firstLoginRequired?: boolean;
  role: string;
  isMasterAdmin: boolean;
  isOrgAdmin: boolean;
}

export async function fetchBootstrapStatus() {
  return api<BootstrapStatus>("/api/auth/bootstrap/status");
}

export async function createMasterAdmin(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone: string;
  jobTitle: string;
  securityAccepted: boolean;
}) {
  return api<{
    success: boolean;
    token: string;
    redirectTo: string;
    user: { id: string; email: string; username: string; name: string; role: string; isMasterAdmin: boolean };
  }>("/api/auth/bootstrap/create-master", {
    method: "POST",
    token: token(),
    body: JSON.stringify(data),
  });
}

export async function fetchPasswordPolicy() {
  return api<PasswordPolicy>("/api/auth/password/policy", { token: token() });
}

export async function requestPasswordChangeCode(currentPassword: string) {
  return api<{ sent: boolean; devCode?: string }>("/api/auth/password/request-code", {
    method: "POST",
    token: token(),
    body: JSON.stringify({ currentPassword }),
  });
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
  emailCode?: string;
}) {
  return api("/api/auth/change-password", {
    method: "POST",
    token: token(),
    body: JSON.stringify(data),
  });
}

export async function updateProfile(data: {
  currentPassword: string;
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}) {
  return api("/api/auth/profile", {
    method: "PATCH",
    token: token(),
    body: JSON.stringify(data),
  });
}

export async function checkPasswordStrength(password: string) {
  return api<{
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    notTemp: boolean;
    score: number;
  }>("/api/auth/check-password-strength", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
