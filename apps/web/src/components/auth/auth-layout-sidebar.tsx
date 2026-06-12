"use client";

import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { useTranslation } from "@/providers/i18n-provider";

export function AuthLayoutSidebar() {
  const { t } = useTranslation();

  return (
    <div className="hidden w-1/2 lg:flex lg:flex-col lg:justify-between lg:p-12" style={{ backgroundColor: "#003B16" }}>
      <EcoPetLogo href="/" variant="dark" showText size="lg" />
      <div>
        <h2 className="font-display text-3xl font-bold text-white">{t("auth.layout.headline")}</h2>
        <p className="mt-4 text-white/70">{t("auth.layout.subtitle")}</p>
      </div>
      <p className="text-sm text-white/50">{t("auth.layout.copyright")}</p>
    </div>
  );
}
