"use client";

import { useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

export function PartnerServiceManager() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{t("empty.marketplace.servicesTitle")}</h3>
          <p className="text-sm text-ecopet-gray">{t("empty.marketplace.servicesHint")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> {t("empty.marketplace.addService")}</Button>
      </div>

      {showForm && (
        <div className="rounded-[16px] border border-ecopet-green/20 p-4 text-sm text-ecopet-gray">
          {t("empty.marketplace.formPending")}
        </div>
      )}

      <EmptyState
        icon={Wrench}
        title={t("empty.marketplace.noServices")}
        description={t("empty.marketplace.noServicesHint")}
      />
    </div>
  );
}
