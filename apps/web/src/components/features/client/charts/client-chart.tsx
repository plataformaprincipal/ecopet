"use client";

type Point = { label: string; value: number };

type Props = {
  title: string;
  points: Point[];
  type?: "bar" | "line";
  valuePrefix?: string;
  className?: string;
};

const COLORS = ["#003B16", "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444"];

export function ClientChart({ title, points, type = "bar", valuePrefix = "", className }: Props) {
  if (points.length === 0) {
    return (
      <div className={`rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60 ${className ?? ""}`}>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-zinc-500">Sem dados no período.</p>
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);

  if (type === "line") {
    const w = 320;
    const h = 120;
    const coords = points.map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * w;
      const y = h - (p.value / max) * (h - 8);
      return `${x},${y}`;
    });
    return (
      <div className={`rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60 ${className ?? ""}`}>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
          <polyline fill="none" stroke="#003B16" strokeWidth="2" points={coords.join(" ")} />
        </svg>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
          {points.map((p) => (
            <span key={p.label}>{p.label}: {valuePrefix}{p.value.toLocaleString("pt-BR")}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60 ${className ?? ""}`}>
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <div className="space-y-2">
        {points.map((p, i) => (
          <div key={p.label} className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span className="truncate">{p.label}</span>
              <span>{valuePrefix}{p.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${(p.value / max) * 100}%`, background: COLORS[i % COLORS.length] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
