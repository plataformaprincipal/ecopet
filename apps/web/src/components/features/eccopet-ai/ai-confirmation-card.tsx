"use client";

import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import type { AIConfirmation } from "./types";

/** Prévia de mutação: só executa após clique explícito, nunca por texto do modelo. */
export function AIConfirmationCard({
  confirmation,
  onConfirm,
  onCancel,
}: {
  confirmation: AIConfirmation;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const running = confirmation.status === "running";
  const settled =
    confirmation.status === "confirmed" ||
    confirmation.status === "cancelled" ||
    confirmation.status === "error";

  const toolLabel = t(`ecopetAi.confirm.${confirmation.toolName}`);
  const title = toolLabel.startsWith("ecopetAi.") ? t("ecopetAi.confirm.title") : toolLabel;

  return (
    <div className="w-full rounded-2xl border border-ecopet-green/30 bg-ecopet-green/5 p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-ecopet-green">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        {title}
      </div>

      {confirmation.message ? (
        <p className="mt-1.5 text-zinc-600 dark:text-zinc-300">{confirmation.message}</p>
      ) : null}

      <dl className="mt-2 space-y-1">
        {previewRows(confirmation.preview).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-xs">
            <dt className="shrink-0 font-medium text-zinc-500">{key}</dt>
            <dd className="truncate text-zinc-700 dark:text-zinc-200">{value}</dd>
          </div>
        ))}
      </dl>

      {settled ? (
        <p
          className={
            confirmation.status === "error"
              ? "mt-2.5 text-xs font-medium text-red-600"
              : "mt-2.5 text-xs font-medium text-ecopet-green"
          }
          role="status"
        >
          {confirmation.resultMessage ??
            (confirmation.status === "cancelled"
              ? t("ecopetAi.confirm.cancelled")
              : t("ecopetAi.confirm.confirm"))}
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="rounded-xl" onClick={onConfirm} disabled={running || !onConfirm}>
            {running ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="mr-1 h-3.5 w-3.5" aria-hidden />
            )}
            {t("ecopetAi.confirm.confirm")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={onCancel}
            disabled={running || !onCancel}
          >
            <X className="mr-1 h-3.5 w-3.5" aria-hidden />
            {t("ecopetAi.confirm.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}

function previewRows(preview: unknown): Array<[string, string]> {
  if (!preview || typeof preview !== "object" || Array.isArray(preview)) return [];
  return Object.entries(preview as Record<string, unknown>)
    .filter(([, v]) => v != null && (typeof v === "string" || typeof v === "number" || typeof v === "boolean"))
    .slice(0, 6)
    .map(([k, v]) => [k, String(v).slice(0, 120)]);
}
