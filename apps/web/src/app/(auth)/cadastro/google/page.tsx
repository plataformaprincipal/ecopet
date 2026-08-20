"use client";

import { GoogleOnboardingForm } from "@/components/features/auth/google-onboarding-form";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { useTranslation } from "@/providers/i18n-provider";

export default function GoogleCadastroPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="mb-6 flex justify-center">
        <EcoPetLogo href="/" size="lg" showText variant="light" />
      </div>
      <div className="rounded-[var(--radius-xl)] border border-ecopet-gray/10 bg-white/90 p-6 shadow-[var(--shadow-lg)] dark:border-white/10 dark:bg-ecopet-dark-card/90">
        <h1 className="font-display text-2xl font-bold text-ecopet-dark dark:text-white">
          {t("auth.google.title")}
        </h1>
        <p className="mt-2 mb-6 text-sm text-ecopet-gray dark:text-white/70">
          {t("auth.google.completeHint")}
        </p>
        <GoogleOnboardingForm />
      </div>
    </main>
  );
}
