"use client";

type Props = {
  title: string;
  body: string;
  onApply?: () => void;
  applyLabel?: string;
};

export function AISuggestionCard({ title, body, onApply, applyLabel = "Usar sugestão" }: Props) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">{body}</p>
      {onApply && (
        <button
          type="button"
          onClick={onApply}
          className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {applyLabel}
        </button>
      )}
    </article>
  );
}
