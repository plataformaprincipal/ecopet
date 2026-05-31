"use client";

interface ProductionChartMockProps {
  title?: string;
  data?: { label: string; value: number; color?: string }[];
}

const DEFAULT_DATA = [
  { label: "Jan", value: 65, color: "bg-ecopet-green" },
  { label: "Fev", value: 72, color: "bg-ecopet-green" },
  { label: "Mar", value: 68, color: "bg-ecopet-green" },
  { label: "Abr", value: 85, color: "bg-ecopet-green" },
  { label: "Mai", value: 92, color: "bg-ecopet-yellow" },
  { label: "Jun", value: 88, color: "bg-ecopet-green" },
];

export function ProductionChartMock({ title = "Produtividade (sc/ha)", data = DEFAULT_DATA }: ProductionChartMockProps) {
  const max = Math.max(...data.map((d) => d.value));

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
