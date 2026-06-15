import type { AccountStatus, UserRole } from "@prisma/client";

export type GestorMetric = { key: string; label: string; value: number; variant?: "default" | "warning" | "critical" | "success" };

export type GestorPagination = { page: number; limit: number; total: number; pages: number };

export type GestorUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  city: string | null;
  state: string | null;
  cpfMasked: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  petsCount: number;
  ordersCount: number;
  postsCount: number;
};

export type GestorPartnerRow = {
  userId: string;
  name: string;
  email: string;
  accountStatus: AccountStatus;
  cnpjMasked: string | null;
  city: string | null;
  state: string | null;
  productsCount: number;
  servicesCount: number;
  ordersCount: number;
  avgRating: number | null;
  reportsCount: number;
  createdAt: string;
};

export type GestorReportType =
  | "users"
  | "partners"
  | "ongs"
  | "products"
  | "services"
  | "orders"
  | "appointments"
  | "social"
  | "moderation"
  | "support"
  | "integrations"
  | "audit";
