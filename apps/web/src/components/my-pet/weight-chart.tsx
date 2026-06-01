"use client";

export function WeightChart({ records }: { records: { weight: number; recordedAt: string }[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-ecopet-gray">Nenhum registro de peso ainda.</p>;
  }

  const sorted = [...records].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const weights = sorted.map((r) => r.weight);
  const min = Math.min(...weights) * 0.9;
  const max = Math.max(...weights) * 1.1 || 1;
  const range = max - min || 1;

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 320 120" className="h-32 w-full rounded-xl bg-ecopet-green/5 p-2">
        <polyline
          fill="none"
          stroke="#2E7D4F"
          strokeWidth="2.5"
          points={sorted
            .map((r, i) => {
              const x = sorted.length === 1 ? 160 : (i / (sorted.length - 1)) * 300 + 10;
              const y = 110 - ((r.weight - min) / range) * 90;
              return `${x},${y}`;
            })
            .join(" ")}
        />
        {sorted.map((r, i) => {
          const x = sorted.length === 1 ? 160 : (i / (sorted.length - 1)) * 300 + 10;
          const y = 110 - ((r.weight - min) / range) * 90;
          return <circle key={i} cx={x} cy={y} r="4" fill="#2E7D4F" />;
        })}
      </svg>
      <div className="space-y-1">
        {[...sorted].reverse().slice(0, 5).map((r, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{new Date(r.recordedAt).toLocaleDateString("pt-BR")}</span>
            <span className="font-medium">{r.weight} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
