"use client";

import { Map } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

export function RealtimeMapMock() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-ecopet-green/25 bg-ecopet-green/[0.03] p-8 text-center">
      <Map className="mb-3 h-10 w-10 text-ecopet-green/60" aria-hidden />
      <p className="text-sm font-medium text-ecopet-dark dark:text-white">{t("empty.agro.noMapData")}</p>
      <p className="mt-1 text-xs text-ecopet-gray">{t("empty.agro.noMapDataHint")}</p>
    </div>
  );
}
