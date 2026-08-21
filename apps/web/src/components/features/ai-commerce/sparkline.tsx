"use client";

type Point = { label: string; value: number; unit?: string };

export function Sparkline({
  title,
  points,
  unit = "",
  goal,
  empty = "Sem série comparável ainda.",
}: {
  title: string;
  points: Point[];
  unit?: string;
  goal?: number | null;
  empty?: string;
}) {
  if (points.length < 2) {
    return (
      <div className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }
  const w = 360;
  const h = 140;
  const pad = 16;
  const values = points.map((p) => p.value);
  if (goal != null) values.push(goal);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
    return { x, y, p };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const goalY = goal == null ? null : h - pad - ((goal - min) / span) * (h - pad * 2);

  return (
    <div className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
      <h3 className="text-sm font-semibold">{title}</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-36 w-full" role="img" aria-label={title}>
        {goalY != null && (
          <line x1={pad} y1={goalY} x2={w - pad} y2={goalY} stroke="currentColor" strokeDasharray="4 4" opacity="0.35" />
        )}
        <polyline fill="none" stroke="#16a34a" strokeWidth="2.5" points={line} />
        {coords.map((c) => (
          <circle key={c.p.label} cx={c.x} cy={c.y} r="4" fill="#16a34a">
            <title>
              {c.p.label}: {c.p.value} {c.p.unit ?? unit}
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}
