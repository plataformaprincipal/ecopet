"use client";

import { BarChart3 } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

interface ProductionChartMockProps {
  title?: string;
  data?: { label: string; value: number; color?: string }[];
}

export function ProductionChartMock({ title, data = [] }: ProductionChartMockProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-ecopet-green/25 bg-ecopet-green/[0.03] p-6 text-center">
        <BarChart3 className="mb-2 h-8 w-8 text-ecopet-green/60" aria-hidden />
        <p className="text-sm font-medium text-ecopet-dark dark:text-white">{title ?? t("empty.admin.noData")}</p>
        <p className="mt-1 text-xs text-ecopet-gray">{t("empty.admin.noData")}</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-2xl border border-ecopet-gray/10 p-4 dark:bg-white/5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <div className="flex h-40 items-end gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold">{d.value}</span>
            <div
              className={`w-full rounded-t-lg ${d.color ?? "bg-ecopet-green"} transition-all`}
              style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }}
            />
            <span className="text-[10px] text-ecopet-gray">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
