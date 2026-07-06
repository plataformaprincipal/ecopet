import type { ErpChart, ErpKpi } from "./types";

export function exportRowsCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  downloadBlob(`${filename}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
}

export function exportRowsExcel(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const tsv = [headers.join("\t"), ...rows.map((r) => headers.map((h) => String(r[h] ?? "")).join("\t"))].join("\n");
  downloadBlob(`${filename}.xls`, tsv, "application/vnd.ms-excel;charset=utf-8");
}

export function exportReportPdf(title: string, kpis: ErpKpi[], rows: Record<string, unknown>[]) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{font-size:20px}</style></head><body>
<h1>${title}</h1><p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
<h2>KPIs</h2><ul>${kpis.map((k) => `<li><strong>${k.label}:</strong> ${k.value}</li>`).join("")}</ul>
${rows.length ? `<h2>Dados</h2><table><thead><tr>${Object.keys(rows[0]).map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>
${rows.map((r) => `<tr>${Object.keys(rows[0]).map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`).join("")}
</tbody></table>` : "<p>Sem registros tabulares.</p>"}
</body></html>`;
  downloadBlob(`${title.replace(/\s+/g, "_")}.html`, html, "text/html;charset=utf-8");
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"')) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob(["\uFEFF", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function kpiAndItemsForExport(data: {
  kpis?: ErpKpi[];
  metrics?: ErpKpi[];
  items?: Record<string, unknown>[];
  tables?: { rows: Record<string, unknown>[] }[];
}) {
  const kpis = data.kpis ?? data.metrics ?? [];
  const items = data.items?.length ? data.items : (data.tables?.[0]?.rows ?? []);
  return { kpis, items };
}
