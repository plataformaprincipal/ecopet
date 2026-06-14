"use client";

import { useTranslation } from "@/providers/i18n-provider";

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main-content"
      className="a11y-skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[99999] focus:rounded-xl focus:bg-ecopet-dark focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:ring-2 focus:ring-ecopet-yellow"
    >
      {t("a11y.skipLink")}
    </a>
  );
}
