import type { AppRole } from "@/lib/permissions";

const ROLE_LABELS: Record<AppRole, string> = {
  CLIENT: "Cliente",
  PARTNER: "Parceiro",
  ONG: "ONG",
  ADMIN: "Administrador",
};

export function formatUserRole(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role as AppRole] ?? role;
}
