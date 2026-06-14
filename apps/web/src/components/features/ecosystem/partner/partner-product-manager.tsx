"use client";

import { useState } from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

export function PartnerProductManager() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{t("empty.marketplace.productsTitle")}</h3>
          <p className="text-sm text-ecopet-gray">{t("empty.marketplace.productsHint")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> {t("empty.marketplace.addProduct")}</Button>
      </div>

      {showForm && (
        <div className="rounded-[16px] border border-ecopet-green/20 p-4 text-sm text-ecopet-gray">
          {t("empty.marketplace.formPending")}
        </div>
      )}

      <EmptyState
        icon={Package}
        title={t("empty.marketplace.noProducts")}
        description={t("empty.marketplace.noProductsHint")}
      />
    </div>
  );
}
