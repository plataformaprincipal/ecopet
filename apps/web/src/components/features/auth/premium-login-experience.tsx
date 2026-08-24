"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FoundationLoginForm } from "@/components/features/foundation/login-form";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { useTranslation } from "@/providers/i18n-provider";
import { FadeIn } from "@/components/design-system/motion";
import { GoogleSignInButton } from "@/components/features/auth/google-sign-in-button";

const GOOGLE_ERROR_KEYS: Record<string, string> = {
  oauth_not_configured: "auth.google.errors.OAUTH_NOT_CONFIGURED",
  cancelled: "auth.google.errors.CANCELLED",
  access_denied: "auth.google.errors.CANCELLED",
  invalid_state: "auth.google.errors.INVALID_STATE",
  invalid_nonce: "auth.google.errors.INVALID_NONCE",
  email_not_verified: "auth.google.errors.EMAIL_NOT_VERIFIED",
  account_exists_password: "auth.google.errors.ACCOUNT_EXISTS_PASSWORD",
  account_suspended: "auth.google.errors.ACCOUNT_SUSPENDED",
  account_inactive: "auth.google.errors.ACCOUNT_INACTIVE",
  partner_google_forbidden: "auth.google.errors.PARTNER_GOOGLE_FORBIDDEN",
  ong_google_forbidden: "auth.google.errors.ONG_GOOGLE_FORBIDDEN",
  admin_forbidden: "auth.google.errors.ADMIN_FORBIDDEN",
  google_account_in_use: "auth.google.errors.GOOGLE_ACCOUNT_IN_USE",
  generic: "auth.google.errors.GENERIC",
};

export function PremiumLoginExperience() {
  const { t } = useTranslation();
  const search = useSearchParams();
  const googleCode = (search.get("google") ?? "").toLowerCase();
  const googleError = googleCode ? t(GOOGLE_ERROR_KEYS[googleCode] ?? "auth.google.errors.GENERIC") : "";

  return (
    <FadeIn className="mx-auto w-full max-w-md">
      <div className="mb-8 flex justify-center lg:hidden">
        <EcoPetLogo href="/" size="lg" showText variant="light" />
      </div>

      <div className="rounded-[var(--radius-xl)] border border-ecopet-gray/10 bg-white/90 p-6 shadow-[var(--shadow-lg)] backdrop-blur-md sm:p-8 dark:border-white/10 dark:bg-ecopet-dark-card/90">
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ecopet-dark dark:text-white">
            {t("authPremium.login.title")}
          </h1>
          <p className="text-sm leading-relaxed text-ecopet-gray dark:text-white/70">
            {t("authPremium.login.subtitle")}
          </p>
        </div>

        <div className="mt-8 space-y-3" role="group" aria-label={t("authPremium.login.socialGroup")}>
          <GoogleSignInButton intent="login" />
        </div>

        {googleError ? (
          <div className="mt-3 space-y-1" role="alert" aria-live="polite">
            <p className="text-sm text-red-600">{googleError}</p>
            {(googleCode === "partner_google_forbidden" || googleCode === "ong_google_forbidden") && (
              <p className="text-sm font-medium text-ecopet-dark dark:text-white">
                {t("auth.google.emailLoginCta")}
              </p>
            )}
          </div>
        ) : null}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-ecopet-gray/15 dark:border-white/10" />
          </div>
          <p className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-white px-3 text-ecopet-gray dark:bg-ecopet-dark-card dark:text-white/50">
              {t("authPremium.login.orEmail")}
            </span>
          </p>
        </div>

        <FoundationLoginForm variant="premium" />

        <p className="mt-8 text-center text-sm text-ecopet-gray dark:text-white/60">
          {t("authPremium.login.noAccount")}{" "}
          <Link href="/cadastro" className="font-semibold text-ecopet-green hover:underline">
            {t("authPremium.login.createAccount")}
          </Link>
        </p>
      </div>
    </FadeIn>
  );
}
