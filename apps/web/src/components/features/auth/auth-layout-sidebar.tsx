"use client";

import Image from "next/image";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { useTranslation } from "@/providers/i18n-provider";
import { FadeIn } from "@/components/design-system/motion";

const AUTH_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&q=80";

export function AuthLayoutSidebar() {
  const { t } = useTranslation();

  return (
    <div className="relative hidden w-[46%] overflow-hidden lg:block xl:w-1/2">
      <Image
        src={AUTH_IMAGE}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-ecopet-dark via-ecopet-dark/80 to-ecopet-green-800/75" />
      <div
        className="pointer-events-none absolute -left-10 bottom-20 h-48 w-48 rounded-full bg-ecopet-green-500/25 blur-3xl"
        aria-hidden
      />
      <div className="relative flex h-full min-h-screen flex-col justify-between p-10 xl:p-14">
        <EcoPetLogo href="/" variant="dark" showText size="xl" />
        <FadeIn>
          <p className="overline-text text-white/50">{t("auth.layout.copyright")}</p>
          <h2 className="mt-3 max-w-md font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            {t("auth.layout.headline")}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">{t("auth.layout.subtitle")}</p>
        </FadeIn>
        <div className="h-px w-24 bg-white/25" aria-hidden />
      </div>
    </div>
  );
}
