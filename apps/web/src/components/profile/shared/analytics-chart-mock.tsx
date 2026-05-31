"use client";

import type { ChartDataPoint } from "@/lib/profile/types";

interface AnalyticsChartMockProps {
  title: string;
  data: ChartDataPoint[];
  valuePrefix?: string;
  height?: number;
}

export function AnalyticsChartMock({ title, data, valuePrefix = "", height = 160 }: AnalyticsChartMockProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-2xl border border-ecopet-gray/10 bg-white p-4 shadow-sm dark:bg-white/5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold">{valuePrefix}{d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}</span>
            <div
              className={`w-full rounded-t-lg transition-all ${d.color ?? "bg-ecopet-green"}`}
              style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }}
            />
            <span className="text-[10px] text-ecopet-gray">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
