"use client";

import { MapPin } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

export function MapFallback({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ecopet-gray/30 bg-ecopet-gray/5 p-6 text-center"
    >
      <MapPin className="h-8 w-8 text-ecopet-gray" aria-hidden />
      <p className="text-sm text-ecopet-gray">{message || t("maps.unavailable")}</p>
      {onRetry ? (
        <button
          type="button"
          className="text-sm font-medium text-ecopet-green underline-offset-2 hover:underline"
          onClick={onRetry}
        >
          {t("maps.tryAgain")}
        </button>
      ) : null}
    </div>
  );
}
