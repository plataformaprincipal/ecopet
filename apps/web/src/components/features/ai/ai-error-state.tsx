"use client";

type Props = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function AIErrorState({ message, onRetry, className }: Props) {
  return (
    <div
      role="alert"
      className={
        className ??
        "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
      }
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
