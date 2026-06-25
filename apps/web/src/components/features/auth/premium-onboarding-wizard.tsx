"use client";

import { useState } from "react";
import { Check, Heart, PawPrint, Store } from "lucide-react";
import { FoundationRegisterForm } from "@/components/features/foundation/register-form";
import {
  RegisterRoleSelector,
  type RegisterRole,
} from "@/components/features/foundation/register-role-selector";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/design-system/motion";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function PremiumOnboardingWizard() {
  const { t } = useTranslation();
  const STEPS = [
    { id: 1, label: t("authPremium.onboarding.step1") },
    { id: 2, label: t("authPremium.onboarding.step2") },
    { id: 3, label: t("authPremium.onboarding.step3") },
    { id: 4, label: t("authPremium.onboarding.step4") },
  ] as const;

  const PREFERENCES = [
    { id: "produtos", label: t("authPremium.onboarding.prefProducts"), icon: Store },
    { id: "servicos", label: t("authPremium.onboarding.prefServices"), icon: PawPrint },
    { id: "adocao", label: t("authPremium.onboarding.prefAdoption"), icon: Heart },
    { id: "comunidade", label: t("authPremium.onboarding.prefCommunity"), icon: Heart },
  ];

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <FadeIn className="mx-auto max-w-lg text-center">
        <div className="card-premium rounded-2xl p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ecopet-green/10">
            <Check className="h-8 w-8 text-ecopet-green" aria-hidden />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-ecopet-dark dark:text-white">
            {t("authPremium.onboarding.welcomeTitle")}
          </h1>
          <p className="mt-3 text-ecopet-gray dark:text-white/70">
            {t("authPremium.onboarding.welcomeDesc")}
          </p>
          <Button asChild className="mt-8 rounded-2xl" size="lg">
            <a href="/dashboard">{t("authPremium.onboarding.goDashboard")}</a>
          </Button>
        </div>
      </FadeIn>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-ecopet-dark dark:text-white">
          {t("authPremium.onboarding.createAccount")}
        </h1>
        <p className="mt-2 text-sm text-ecopet-gray dark:text-white/70">
          {t("authPremium.onboarding.subtitle")}
        </p>
      </div>

      <nav aria-label={t("authPremium.onboarding.progress")} className="flex justify-between gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex flex-1 flex-col items-center gap-1",
              step >= s.id ? "text-ecopet-green" : "text-ecopet-gray/50"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                step >= s.id ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10"
              )}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </span>
            <span className="hidden text-[10px] font-medium sm:block">{s.label}</span>
          </div>
        ))}
      </nav>

      {step === 1 && (
        <FadeIn className="card-premium space-y-6 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ecopet-dark dark:text-white">{t("authPremium.onboarding.who")}</h2>
          <RegisterRoleSelector value={role} onChange={setRole} />
          <Button
            className="w-full rounded-2xl"
            size="lg"
            disabled={!role}
            onClick={() => setStep(2)}
          >
            {t("authPremium.onboarding.continue")}
          </Button>
        </FadeIn>
      )}

      {step === 2 && role && (
        <FadeIn className="space-y-4">
          <div className="card-premium rounded-2xl p-4 sm:p-6">
            <FoundationRegisterForm initialRole={role} embedded />
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
            {t("authPremium.onboarding.back")}
          </Button>
        </FadeIn>
      )}

      {step === 3 && (
        <FadeIn className="card-premium space-y-6 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ecopet-dark dark:text-white">{t("authPremium.onboarding.firstPet")}</h2>
          <p className="text-sm text-ecopet-gray dark:text-white/70">
            {t("authPremium.onboarding.firstPetDesc")}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[t("authPremium.onboarding.petName"), t("authPremium.onboarding.petSpecies"), t("authPremium.onboarding.petPhoto")].map((field) => (
              <div
                key={field}
                className="rounded-2xl border border-dashed border-ecopet-gray/20 p-4 text-center text-sm text-ecopet-gray dark:border-white/10"
              >
                {field}
                <p className="mt-1 text-xs opacity-60">{t("authPremium.onboarding.inPanel")}</p>
              </div>
            ))}
          </div>
          <Button className="w-full rounded-2xl" size="lg" onClick={() => setStep(4)}>
            {t("authPremium.onboarding.continue")}
          </Button>
        </FadeIn>
      )}

      {step === 4 && (
        <FadeIn className="card-premium space-y-6 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ecopet-dark dark:text-white">{t("authPremium.onboarding.prefsTitle")}</h2>
          <p className="text-sm text-ecopet-gray dark:text-white/70">
            {t("authPremium.onboarding.prefsDesc")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PREFERENCES.map(({ id, label, icon: Icon }) => {
              const active = prefs.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setPrefs((p) => (active ? p.filter((x) => x !== id) : [...p, id]))
                  }
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-ecopet-green bg-ecopet-green/5"
                      : "border-ecopet-gray/15 hover:border-ecopet-green/30"
                  )}
                >
                  <Icon className="h-5 w-5 text-ecopet-green" aria-hidden />
                  <span className="font-medium">{label}</span>
                </button>
              );
            })}
          </div>
          <Button className="w-full rounded-2xl" size="lg" onClick={() => setDone(true)}>
            {t("authPremium.onboarding.finish")}
          </Button>
        </FadeIn>
      )}
    </div>
  );
}
