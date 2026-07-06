"use client";

import type { ErpChart } from "@/lib/admin/erp/types";

type Props = { chart: ErpChart; className?: string };

export function ErpChartView({ chart, className }: Props) {
  const points = chart.series[0]?.points ?? [];
  if (!points.length) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground dark:bg-white/5">
        {chart.title} — sem dados no período.
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);

  if (chart.type === "pie") {
    const total = points.reduce((s, p) => s + p.value, 0) || 1;
    let acc = 0;
    const colors = ["#003B16", "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444"];
    return (
      <div className={`rounded-2xl border bg-white p-4 dark:bg-white/5 ${className ?? ""}`}>
        <h3 className="mb-3 text-sm font-semibold">{chart.title}</h3>
        <div className="flex flex-wrap items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-32 w-32">
            {points.map((p, i) => {
              const pct = p.value / total;
              const start = acc;
              acc += pct;
              const x1 = 50 + 40 * Math.cos(2 * Math.PI * start);
              const y1 = 50 + 40 * Math.sin(2 * Math.PI * start);
              const x2 = 50 + 40 * Math.cos(2 * Math.PI * acc);
              const y2 = 50 + 40 * Math.sin(2 * Math.PI * acc);
              const large = pct > 0.5 ? 1 : 0;
              return (
                <path
                  key={p.label}
                  d={`M50,50 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z`}
                  fill={colors[i % colors.length]}
                />
              );
            })}
          </svg>
          <ul className="space-y-1 text-xs">
            {points.map((p, i) => (
              <li key={p.label} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                {p.label}: {p.value.toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (chart.type === "line") {
    const w = 320;
    const h = 120;
    const coords = points.map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * w;
      const y = h - (p.value / max) * (h - 8);
      return `${x},${y}`;
    });
    return (
      <div className={`rounded-2xl border bg-white p-4 dark:bg-white/5 ${className ?? ""}`}>
        <h3 className="mb-3 text-sm font-semibold">{chart.title}</h3>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full max-w-md">
          <polyline fill="none" stroke="#003B16" strokeWidth="2" points={coords.join(" ")} />
        </svg>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border bg-white p-4 dark:bg-white/5 ${className ?? ""}`}>
      <h3 className="mb-3 text-sm font-semibold">{chart.title}</h3>
      <div className="space-y-2">
        {points.map((p) => (
          <div key={p.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="truncate">{p.label}</span>
              <span className="font-medium">{p.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-ecopet-green"
                style={{ width: `${Math.max((p.value / max) * 100, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
