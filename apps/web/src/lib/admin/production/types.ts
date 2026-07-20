export type ProductionCheckStatus = "PASS" | "WARN" | "FAIL" | "MANUAL" | "N/A";

export type ProductionCheckItem = {
  id: string;
  area: string;
  title: string;
  status: ProductionCheckStatus;
  detail: string;
  href?: string;
};

export type ProductionServiceStatus = {
  id: string;
  name: string;
  status: string;
  configured: boolean;
  detail?: string;
};

export type ProductionSupabaseSummary = {
  databaseConfigured: boolean;
  databaseHost: string | null;
  directUrlConfigured: boolean;
  directUrlHost: string | null;
  vercelAugmentation: boolean;
  backupsDaily: "MANUAL_CONFIRM";
  pitrEnabled: boolean;
  pitrNote: string;
  authProvider: "custom_jwt_prisma";
  storagePrimary: "cloudinary";
  supabaseStorageImplemented: boolean;
  lastAuditAt: string;
};

export type ProductionReadinessReport = {
  generatedAt: string;
  environment: string;
  version: string;
  build: string | null;
  vercelEnv: string | null;
  overall: "READY" | "READY_WITH_WARNINGS" | "NOT_READY";
  services: ProductionServiceStatus[];
  checks: ProductionCheckItem[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
    manual: number;
  };
  /** Resumo sanitizado Supabase/Postgres (sem secrets). */
  supabase?: ProductionSupabaseSummary;
  meta: {
    lastSyncAt: string | null;
    notes: string[];
  };
};
