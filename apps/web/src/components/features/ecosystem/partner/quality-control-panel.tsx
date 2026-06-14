"use client";

import { Shield } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

export function QualityControlPanel() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Shield}
      title={t("empty.admin.noData")}
      description={t("empty.admin.noData")}
    />
  );
}
