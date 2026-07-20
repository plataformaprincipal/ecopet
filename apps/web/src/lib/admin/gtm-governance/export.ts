import type { GtmGovernanceReport } from "./types";

export type GtmExportFormat = "json" | "csv" | "excel" | "pdf";

export function exportGovernanceJson(report: GtmGovernanceReport): string {
  return JSON.stringify(report, null, 2);
}

/** CSV resumido (módulos + alertas) — Excel abre CSV; PDF = texto estruturado. */
export function exportGovernanceCsv(report: GtmGovernanceReport): string {
  const lines = [
    "section,key,value",
    `overview,status,${report.overview.status}`,
    `overview,environment,${report.overview.environment}`,
    `overview,container,${report.overview.containerIdMasked ?? ""}`,
    `overview,gaStatus,${report.overview.gaStatus}`,
    `health,status,${report.health.status}`,
    ...report.bi.eventsByModule.map(
      (m) => `bi,module_${m.module},${m.count}`
    ),
    ...report.alerts.map((a) => `alert,${a.severity},${csvEscape(a.title)}`),
    ...report.modules.map(
      (m) => `module,${m.module},${m.eventCount}`
    ),
  ];
  return lines.join("\n");
}

export function exportGovernanceExcel(report: GtmGovernanceReport): string {
  // Compatível com Excel via CSV UTF-8 BOM
  return `\uFEFF${exportGovernanceCsv(report)}`;
}

export function exportGovernancePdfText(report: GtmGovernanceReport): string {
  return [
    "EcoPet — GTM Governance Report",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.overview.status}`,
    `Environment: ${report.overview.environment}`,
    `Container: ${report.overview.containerIdMasked ?? "n/a"}`,
    `Health: ${report.health.status}`,
    "",
    "Alerts:",
    ...report.alerts.map((a) => `- [${a.severity}] ${a.title}: ${a.detail}`),
    "",
    "Modules:",
    ...report.modules.map((m) => `- ${m.label}: ${m.eventCount} events`),
    "",
    report.meta.dataSource,
  ].join("\n");
}

function csvEscape(v: string) {
  if (v.includes(",") || v.includes('"')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
