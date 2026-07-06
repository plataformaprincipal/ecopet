type Props = {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
};

export function AdminAlert({ type, message, onDismiss }: Props) {
  const styles =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${styles}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          aria-label="Fechar alerta"
        >
          Fechar
        </button>
      )}
    </div>
  );
}
