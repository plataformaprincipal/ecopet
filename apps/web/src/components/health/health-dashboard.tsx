"use client";

import Link from "next/link";
import { PawPrint } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EcopetWatermark } from "@/components/brand/ecopet-symbol";
import { useTranslation } from "@/providers/i18n-provider";

export function HealthDashboard() {
  const { t } = useTranslation();

  return (
    <>
      <AppHeader title="ECOPET Health" />
      <main className="relative mx-auto max-w-5xl flex-1 p-4 lg:p-6 space-y-6">
        <EcopetWatermark />
        <div className="relative">
          <h1 className="heading-2">{t("empty.health.title")}</h1>
          <p className="secondary-text">{t("empty.health.subtitle")}</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-6">
            <EmptyState
              icon={PawPrint}
              title={t("empty.pets.title")}
              description={t("empty.pets.description")}
              actionLabel={t("empty.pets.action")}
              actionHref="/meu-pet"
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
