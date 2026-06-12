"use client";

import {
  LOCALE_REGIONS,
  getLocalesByRegion,
  type LocaleCode,
  type LocaleRegion,
} from "@/i18n/locales/registry";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

const REGION_LABEL_FALLBACK: Record<LocaleRegion, string> = {
  europe: "Europa / Europe",
  middleEast: "Oriente Médio / Middle East",
  asia: "Ásia / Asia",
  africa: "África / Africa",
};

export function LanguageSelector({ className, compact }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className={cn("w-full", className)}>
      {!compact && (
        <label htmlFor="ecopet-lang-select" className="mb-1 block text-xs font-semibold text-ecopet-gray">
          {t("a11y.language.title")}
        </label>
      )}
      <select
        id="ecopet-lang-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as LocaleCode)}
        aria-label={t("lang.selector.label")}
        title={t("lang.selector.label")}
        className="h-10 w-full rounded-xl border border-ecopet-gray/20 bg-white px-3 text-sm focus:border-ecopet-green focus:outline-none focus:ring-2 focus:ring-ecopet-green/20 dark:bg-white/5"
      >
        {LOCALE_REGIONS.map((region) => {
          const locales = getLocalesByRegion(region.id);
          const regionLabel = t(region.labelKey as Parameters<typeof t>[0]) || REGION_LABEL_FALLBACK[region.id];
          return (
            <optgroup key={region.id} label={regionLabel}>
              {locales.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.nativeLabel}
                  {!loc.hasStaticBundle ? ` (${t("common.comingSoon")})` : ""}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      {!compact && (
        <p className="mt-2 text-[11px] leading-relaxed text-ecopet-gray">
          ✦ {t("a11y.language.autoTranslateNote")}
        </p>
      )}
    </div>
  );
}
