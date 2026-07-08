/** Redirecionamento pós-login por role — fundação EcoPet */
import type { AppRole } from "@/lib/permissions";

export function dashboardPathForRole(role: string): string {
  switch (role) {
    case "CLIENT":
      return "/cliente";
    case "PARTNER":
      return "/partner";
    case "ONG":
      return "/ngo";
    case "ADMIN":
      return "/admin";
    case "GESTOR":
      return "/gestor";
    default:
      return "/dashboard";
  }
}
