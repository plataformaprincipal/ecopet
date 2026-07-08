"use client";

import { useCallback, useEffect, useState } from "react";
import { FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import type { ClientReportSummary, ReportPeriod } from "@/lib/client/reports";

type ReportsData = { weekly: ClientReportSummary; monthly: ClientReportSummary; annual: ClientReportSummary };

export function ClientRelatoriosPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/relatorios", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (json.success) setData(json.data.reports as ReportsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportReport(period: ReportPeriod, format: "csv" | "pdf") {
    setExporting(`${period}-${format}`);
    try {
      const res = await fetch("/api/client/relatorios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, format }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecopet-relatorio-${period}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  if (loading) return <ClientPageSkeleton />;
  if (!data) return null;

  const cards: { key: ReportPeriod; label: string; summary: ClientReportSummary }[] = [
    { key: "weekly", label: "Semanal", summary: data.weekly },
    { key: "monthly", label: "Mensal", summary: data.monthly },
    { key: "annual", label: "Anual", summary: data.annual },
  ];

  return (
    <div className="space-y-6">
      <ClientPageHeader title="Relatórios" description="Resumos exportáveis em PDF e CSV." />

      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <article key={c.key} className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
            <h2 className="font-semibold">{c.label}</h2>
            <ul className="mt-3 space-y-1 text-sm text-zinc-500">
              <li>Pets: {c.summary.petsCount}</li>
              <li>Gastos: R$ {c.summary.finance.spent.toFixed(2)}</li>
              <li>Bem-estar: {c.summary.wellness.index} ({c.summary.wellness.level})</li>
              <li>Rotina: {c.summary.analytics.routineRate}%</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" disabled={!!exporting} onClick={() => void exportReport(c.key, "csv")}>
                <FileDown className="mr-1 h-3.5 w-3.5" /> CSV
              </Button>
              <Button size="sm" variant="outline" disabled={!!exporting} onClick={() => void exportReport(c.key, "pdf")}>
                <FileText className="mr-1 h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
