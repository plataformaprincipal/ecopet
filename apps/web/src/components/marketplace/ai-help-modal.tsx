"use client";

import { useMarketplaceStore } from "@/store/marketplace-store";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

export function AiHelpModal() {
  const { t } = useTranslation();
  const { aiModalOpen, setAiModalOpen } = useMarketplaceStore();

  function close() {
    setAiModalOpen(false);
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity",
          aiModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-2xl transition-all dark:bg-[#0f1419]",
          aiModalOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="flex flex-col items-center text-center">
          <Sparkles className="mb-3 h-10 w-10 text-ecopet-green" />
          <h3 className="font-display text-lg font-bold">{t("empty.ai.marketplaceTitle")}</h3>
          <p className="mt-2 text-sm text-ecopet-gray">{t("empty.ai.noRecommendations")}</p>
          <Button className="mt-6" onClick={close}>{t("common.cancel")}</Button>
        </div>
      </div>
    </>
  );
}
