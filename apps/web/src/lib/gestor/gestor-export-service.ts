import { writeAuditLog } from "@/lib/audit-log";
import type { GestorReportType } from "@/lib/gestor/gestor.types";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { getGestorReport } from "@/lib/gestor/gestor-reports-service";
import { maskCpf, maskCnpj } from "@/lib/gestor/gestor-utils";

const MAX_EXPORT_ROWS = 500;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(headers: string[], rows: Record<string, unknown>[]) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  return lines.join("\n");
}

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  if ("cpf" in out) out.cpf = maskCpf(String(out.cpf ?? ""));
  if ("cnpj" in out) out.cnpj = maskCnpj(String(out.cnpj ?? ""));
  delete out.passwordHash;
  delete out.password;
  delete out.token;
  delete out.secret;
  return out;
}

function extractItems(data: unknown): Record<string, unknown>[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
  if (Array.isArray(obj.logs)) return obj.logs as Record<string, unknown>[];
  if (obj.integrations && Array.isArray(obj.integrations)) {
    return obj.integrations as Record<string, unknown>[];
  }
  return [];
}

export async function exportGestorReport(params: {
  type: GestorReportType;
  filters: GestorFilters;
  adminId: string;
}) {
  const exportFilters = { ...params.filters, page: 1, limit: Math.min(params.filters.limit, MAX_EXPORT_ROWS) };
  const data = await getGestorReport(params.type, exportFilters);
  const items = extractItems(data).slice(0, MAX_EXPORT_ROWS).map(sanitizeRow);

  if (items.length === 0) {
    return { csv: "no_data\n", rowCount: 0, truncated: false };
  }

  const headers = Object.keys(items[0]);
  const csv = rowsToCsv(headers, items);

  await writeAuditLog({
    actorId: params.adminId,
    action: "EXPORT",
    module: "gestor.reports",
    resource: "Report",
    resourceId: params.type,
    observation: `Exportação CSV do relatório ${params.type}`,
    metadata: {
      type: params.type,
      rowCount: items.length,
      filters: {
        dateFrom: params.filters.dateFrom,
        dateTo: params.filters.dateTo,
        status: params.filters.status,
        role: params.filters.role,
      },
    },
  });

  return {
    csv,
    rowCount: items.length,
    truncated: items.length >= MAX_EXPORT_ROWS,
    filename: `ecopet-gestor-${params.type}-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}
