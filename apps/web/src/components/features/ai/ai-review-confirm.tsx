"use client";

type Props = {
  title: string;
  summary: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

/** Padrão universal: IA prepara, usuário confirma. */
export function AIReviewConfirm({
  title,
  summary,
  confirmLabel = "Revisar e confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-review-title"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
    >
      <h2 id="ai-review-title" className="text-sm font-semibold text-amber-950 dark:text-amber-100">
        {title}
      </h2>
      <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900/90 dark:text-amber-50/90">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
