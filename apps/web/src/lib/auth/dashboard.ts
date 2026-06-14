/** Redirecionamento pós-login por role — fundação EcoPet */
import type { AppRole } from "@/lib/permissions";

export function dashboardPathForRole(role: string): string {
  switch (role) {
    case "CLIENT":
      return "/dashboard/client";
    case "PARTNER":
      return "/dashboard/partner";
    case "ONG":
      return "/dashboard/ong";
    case "ADMIN":
      return "/dashboard/admin";
    case "GESTOR":
      return "/gestor";
    default:
      return "/dashboard";
  }
}
