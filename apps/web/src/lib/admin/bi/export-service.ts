import "server-only";

import type { ErpModuleResponse } from "@/lib/admin/erp/types";

export type BiExportFormat = "csv" | "excel" | "json" | "pdf";

function sanitizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const blocked = /email|password|token|secret|cookie|jwt|cpf|authorization|measurementid/i;
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (blocked.test(k)) continue;
      if (typeof v === "string" && v.includes("@") && v.includes(".")) continue;
      out[k] = v;
    }
    return out;
  });
}

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildBiExportPayload(
  data: ErpModuleResponse,
  format: BiExportFormat
): { body: string; contentType: string; filename: string } {
  const kpis = (data.kpis ?? data.metrics ?? []).map((k) => ({
    key: k.key,
    label: k.label,
    value: k.value,
    delta: k.delta ?? "",
  }));
  const rows = sanitizeRows(
    data.tables?.[0]?.rows?.length
      ? data.tables[0].rows
      : data.items?.length
        ? data.items
        : kpis
  );
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `ecopet-bi-${data.moduleId}-${stamp}`;

  if (format === "json") {
    return {
      body: JSON.stringify(
        {
          moduleId: data.moduleId,
          title: data.title,
          period: data.period,
          kpis,
          rows,
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      contentType: "application/json; charset=utf-8",
      filename: `${base}.json`,
    };
  }

  if (format === "excel") {
    const headers = rows[0] ? Object.keys(rows[0]) : ["label", "value"];
    const tsv = [
      headers.join("\t"),
      ...rows.map((r) => headers.map((h) => String(r[h] ?? "")).join("\t")),
    ].join("\n");
    return {
      body: `\uFEFF${tsv}`,
      contentType: "application/vnd.ms-excel; charset=utf-8",
      filename: `${base}.xls`,
    };
  }

  if (format === "pdf") {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.title ?? "BI"}</title>
<style>body{font-family:Segoe UI,sans-serif;padding:24px;color:#111}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{font-size:22px}</style></head><body>
<h1>${data.title ?? "Business Intelligence"}</h1>
<p>Período: ${String(data.period ?? "—")} · Gerado em ${new Date().toLocaleString("pt-BR")}</p>
<h2>KPIs</h2><ul>${kpis.map((k) => `<li><strong>${k.label}:</strong> ${k.value}</li>`).join("")}</ul>
${
  rows.length
    ? `<h2>Dados</h2><table><thead><tr>${Object.keys(rows[0])
        .map((h) => `<th>${h}</th>`)
        .join("")}</tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr>${Object.keys(rows[0])
              .map((h) => `<td>${r[h] ?? ""}</td>`)
              .join("")}</tr>`
        )
        .join("")}</tbody></table>`
    : ""
}
<p style="margin-top:24px;font-size:12px;color:#666">EcoPet BI — export sanitizado (sem PII / secrets).</p>
</body></html>`;
    return {
      body: html,
      contentType: "text/html; charset=utf-8",
      filename: `${base}.html`,
    };
  }

  // csv default
  const headers = rows[0] ? Object.keys(rows[0]) : ["label", "value"];
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(",")),
  ];
  return {
    body: `\uFEFF${lines.join("\n")}`,
    contentType: "text/csv; charset=utf-8",
    filename: `${base}.csv`,
  };
}
