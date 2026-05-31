"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";
import {
  applyDocumentLocale,
  bootstrapLocale,
  createTranslator,
  detectBrowserLocale,
} from "@/lib/i18n";
import type { LocaleCode } from "@/lib/i18n/config";
import type { TranslationKey } from "@/lib/i18n/types";

const LOCALE_INIT_KEY = "ecopet-locale-detected";

interface I18nContextValue {
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  locale: LocaleCode;
  ready: boolean;
  setLocale: (locale: LocaleCode) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useAccessibilityStore((s) => s.locale);
  const setLocaleStore = useAccessibilityStore((s) => s.setLocale);
  const [ready, setReady] = useState(false);
  const [cacheVersion, bump] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(LOCALE_INIT_KEY)) {
      localStorage.setItem(LOCALE_INIT_KEY, "1");
      setLocaleStore(detectBrowserLocale());
    }
    setReady(true);
  }, [setLocaleStore]);

  useEffect(() => {
    applyDocumentLocale(locale);
    bootstrapLocale(locale);
  }, [locale]);

  useEffect(() => {
    const onUpdate = () => bump((n) => n + 1);
    window.addEventListener("ecopet-i18n-updated", onUpdate);
    return () => window.removeEventListener("ecopet-i18n-updated", onUpdate);
  }, []);

  const t = useMemo(() => {
    void cacheVersion;
    return createTranslator(locale);
  }, [locale, cacheVersion]);

  const value = useMemo(
    () => ({
      t,
      locale,
      ready,
      setLocale: setLocaleStore,
    }),
    [t, locale, ready, setLocaleStore]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
