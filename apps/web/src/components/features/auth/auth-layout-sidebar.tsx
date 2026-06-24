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
    <div className="relative hidden w-1/2 overflow-hidden lg:block">
      <Image
        src={AUTH_IMAGE}
        alt="Tutor e pet em momento de carinho"
        fill
        priority
        className="object-cover"
        sizes="50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-ecopet-dark/90 via-ecopet-dark/70 to-ecopet-green/80" />
      <div className="relative flex h-full flex-col justify-between p-12">
        <EcoPetLogo href="/" variant="dark" showText size="lg" />
        <FadeIn>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            {t("auth.layout.headline")}
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/80">{t("auth.layout.subtitle")}</p>
        </FadeIn>
        <p className="text-sm text-white/50">{t("auth.layout.copyright")}</p>
      </div>
    </div>
  );
}
