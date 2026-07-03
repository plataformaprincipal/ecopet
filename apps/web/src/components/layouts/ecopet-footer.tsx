"use client";

import Link from "next/link";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Phone, MessageCircle } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { useSupportChat } from "@/providers/support-chat-provider";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslationKey } from "@/lib/i18n/types";

const PHONE = "(83) 99617-5215";
const PHONE_TEL = "+5583996175215";
const WHATSAPP_URL = `https://wa.me/5583996175215`;

type NavLink = { href: string; labelKey: TranslationKey; authRequired?: boolean };

const NAV_LINKS: NavLink[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/marketplace", labelKey: "nav.marketplace" },
  { href: "/explorar", labelKey: "nav.explore" },
  { href: "/marketplace/servicos", labelKey: "nav.services" },
  { href: "/meu-pet", labelKey: "nav.petRegistration" },
  { href: "/perfil", labelKey: "nav.profile" },
  { href: "/termos-de-uso", labelKey: "nav.termsOfUse" },
  { href: "/politica-de-privacidade", labelKey: "nav.privacyPolicy" },
];

function resolveHref(link: NavLink, isAuthenticated: boolean): string {
  if (link.authRequired && !isAuthenticated) {
    return `/login?callbackUrl=${encodeURIComponent(link.href)}`;
  }
  return link.href;
}

export function EcopetFooter() {
  const { openChat, hasUnread } = useSupportChat();
  const { t } = useTranslation();
  const { status } = useAuthSession();
  const isAuthenticated = status === "authenticated";

  return (
    <footer className="border-t border-ecopet-gray/15 bg-[#003B16] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <EcoPetLogo href="/" variant="dark" size="md" showText />
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              {t("common.navigation")}
            </h3>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={resolveHref(link, isAuthenticated)} className="text-white/75 transition hover:text-white hover:underline">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              {t("common.contact")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li>
                <span className="block text-xs uppercase tracking-wide text-white/50">{t("common.phone")}</span>
                <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-2 hover:text-white hover:underline">
                  <Phone className="h-4 w-4 text-ecopet-yellow" />
                  {PHONE}
                </a>
              </li>
              <li>
                <span className="block text-xs uppercase tracking-wide text-white/50">WhatsApp</span>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white hover:underline"
                >
                  <MessageCircle className="h-4 w-4 text-ecopet-yellow" />
                  {PHONE}
                </a>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={openChat}
                  className="inline-flex items-center gap-2 rounded-xl bg-ecopet-yellow px-4 py-2.5 text-sm font-semibold text-ecopet-dark transition hover:bg-ecopet-yellow/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("common.support")}
                  {hasUnread && (
                    <span className="ml-1 h-2 w-2 rounded-full bg-red-500" aria-label={t("footer.newMessage")} />
                  )}
                </button>
                <p className="mt-2 text-xs text-white/50">{t("footer.chatHint")}</p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              ECOPET
            </h3>
            <p className="mt-4 text-sm text-white/70">
              {t("footer.about")}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          {t("footer.copyright", { year: String(new Date().getFullYear()) })}
        </div>
      </div>
    </footer>
  );
}
