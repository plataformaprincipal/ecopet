"use client";

type Props = {
  used: number;
  limit: number;
  label?: string;
};

export function AIUsageIndicator({ used, limit, label = "Uso diário de IA" }: Props) {
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div className="space-y-1" aria-label={`${label}: ${used} de ${limit}`}>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
