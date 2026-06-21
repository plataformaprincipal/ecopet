"use client";

import { LanguageSelector } from "@/components/features/i18n/language-selector";

export function AuthLayoutLanguageBar() {
  return (
    <div className="flex justify-end border-b border-ecopet-gray/10 px-4 py-2 dark:border-white/10 lg:absolute lg:right-6 lg:top-4 lg:z-10 lg:border-0 lg:p-0">
      <LanguageSelector compact />
    </div>
  );
}
