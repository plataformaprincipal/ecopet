"use client";

type Item = {
  entityId: string;
  entityType: string;
  score: number;
  explanation: string;
  sponsored?: boolean;
  sponsoredLabel?: string;
};

type Props = {
  items: Item[];
  title?: string;
};

export function AIRecommendationPanel({ items, title = "Recomendações" }: Props) {
  if (!items.length) return null;
  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={`${item.entityType}-${item.entityId}`}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{item.explanation}</span>
              <span className="text-xs text-zinc-500">{Math.round(item.score * 100)}%</span>
            </div>
            {item.sponsored && (
              <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                {item.sponsoredLabel ?? "Patrocinado"}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
