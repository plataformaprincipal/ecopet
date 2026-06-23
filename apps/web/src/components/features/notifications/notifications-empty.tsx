"use client";

import { BellOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/providers/i18n-provider";

interface NotificationsEmptyProps {
  hasSearch?: boolean;
}

export function NotificationsEmpty({ hasSearch }: NotificationsEmptyProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ecopet-green/10">
          <BellOff className="h-8 w-8 text-ecopet-green" />
        </div>
        <h3 className="font-display text-lg font-bold text-ecopet-dark dark:text-white">
          {hasSearch ? t("empty.noResults") : t("notifications.empty.title")}
        </h3>
        <p className="mt-2 max-w-xs text-sm text-ecopet-gray">
          {hasSearch ? t("empty.noResultsHint") : t("notifications.empty.description")}
        </p>
      </CardContent>
    </Card>
  );
}
