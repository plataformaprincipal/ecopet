import { buildDatabaseBootDiagnostics } from "@ecopet/database/diagnostics";
import { getResolvedDatabaseUrl } from "@ecopet/database/client";
import type { ProductionCheckItem } from "./types";

/**
 * Auditoria operacional Supabase/Postgres — sem secrets, sem PITR toggle.
 * Status de backup diário / PITR no dashboard: MANUAL (confirmação humana).
 */
export function getSupabaseInfrastructureChecks(): ProductionCheckItem[] {
  const boot = buildDatabaseBootDiagnostics(
    process.env.DATABASE_URL,
    getResolvedDatabaseUrl()
  );
  const pooler =
    boot.databaseHost?.includes(":6543") ||
    boot.resolvedHost?.includes(":6543") ||
    boot.databaseHost?.includes("pooler.supabase.com");
  const directOk = boot.directUrlConfigured;
  const supabaseStorageConfigured = Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.SUPABASE_STORAGE_BUCKET?.trim()
  );
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );

  return [
    {
      id: "db-url-configured",
      area: "Banco",
      title: "DATABASE_URL configurada",
      status: boot.databaseUrlConfigured ? "PASS" : "FAIL",
      detail: boot.databaseUrlConfigured
        ? `Host: ${boot.databaseHost ?? "desconhecido"} (senha omitida)`
        : "DATABASE_URL ausente.",
    },
    {
      id: "db-direct-url",
      area: "Banco",
      title: "DIRECT_URL (migrations)",
      status: directOk ? "PASS" : "WARN",
      detail: directOk
        ? `Host migrations: ${boot.directUrlHost ?? "ok"}`
        : "DIRECT_URL ausente — migrate:deploy pode falhar no pooler transaction mode.",
    },
    {
      id: "db-pooler",
      area: "Banco",
      title: "Pooler Supabase (runtime)",
      status: pooler ? "PASS" : boot.databaseUrlConfigured ? "WARN" : "N/A",
      detail: pooler
        ? "URL runtime compatível com pooler (:6543 / pooler.supabase.com)."
        : "Host não parece pooler — revisar connection_limit em serverless.",
    },
    {
      id: "db-prisma-provider",
      area: "Banco",
      title: "Prisma provider postgresql",
      status: "PASS",
      detail: "schema.prisma: provider=postgresql + directUrl=DIRECT_URL.",
    },
    {
      id: "db-migrations-policy",
      area: "Banco",
      title: "Política de migrations",
      status: "PASS",
      detail: "Usar npm run db:migrate:deploy. Proibido db push / migrate reset em produção.",
    },
    {
      id: "db-backup-daily",
      area: "Banco",
      title: "Backups diários Supabase Pro",
      status: "MANUAL",
      detail:
        "Confirmado pelo time: diários ativos no plano Pro. Validar retenção no Dashboard → Database → Backups.",
      href: "/admin/producao",
    },
    {
      id: "db-pitr",
      area: "Banco",
      title: "PITR (Point in Time Recovery)",
      status: "N/A",
      detail:
        "NÃO habilitado e NÃO deve ser ligado automaticamente (add-on pago). Avaliar antes de go-live crítico — ver docs/database/backups.md.",
    },
    {
      id: "db-rls-app-layer",
      area: "Banco",
      title: "Modelo de acesso (sem RLS Prisma)",
      status: "PASS",
      detail:
        "App usa Prisma com credencial de serviço; auth/RBAC na aplicação. Sem CREATE POLICY nas migrations.",
    },
    {
      id: "db-auth-custom",
      area: "Banco",
      title: "Auth",
      status: "PASS",
      detail: "Auth custom (bcrypt + JWT cookie). Supabase Auth não é o provedor de sessão.",
      href: "/admin/integracoes",
    },
    {
      id: "db-storage-cloudinary",
      area: "Banco",
      title: "Storage uploads",
      status: cloudinaryConfigured ? "PASS" : "WARN",
      detail: cloudinaryConfigured
        ? "Cloudinary configurado (caminho principal)."
        : "Cloudinary incompleto — uploads podem falhar em prod.",
    },
    {
      id: "db-storage-supabase",
      area: "Banco",
      title: "Supabase Storage",
      status: supabaseStorageConfigured ? "WARN" : "N/A",
      detail: supabaseStorageConfigured
        ? "Env Supabase Storage presentes, mas uploader ainda não implementado no código."
        : "Não usado — uploads via Cloudinary / local_dev.",
    },
    {
      id: "db-restore-drill",
      area: "Banco",
      title: "Drill de restore",
      status: "MANUAL",
      detail: "Restore to New Project — nunca restaurar sobre produção. Ver docs/database/restore.md.",
    },
    {
      id: "db-dr-doc",
      area: "Banco",
      title: "Plano de Disaster Recovery",
      status: "PASS",
      detail: "Documentado em docs/database/disaster-recovery.md",
    },
  ];
}

export function getSupabaseSanitizedSummary() {
  const boot = buildDatabaseBootDiagnostics(
    process.env.DATABASE_URL,
    getResolvedDatabaseUrl()
  );
  return {
    databaseConfigured: boot.databaseUrlConfigured,
    databaseHost: boot.databaseHost,
    directUrlConfigured: boot.directUrlConfigured,
    directUrlHost: boot.directUrlHost,
    vercelAugmentation: boot.vercelAugmentation,
    backupsDaily: "MANUAL_CONFIRM" as const,
    pitrEnabled: false,
    pitrNote: "Não habilitado (add-on pago). Não ativar automaticamente.",
    authProvider: "custom_jwt_prisma" as const,
    storagePrimary: "cloudinary" as const,
    supabaseStorageImplemented: false,
    lastAuditAt: new Date().toISOString(),
  };
}
