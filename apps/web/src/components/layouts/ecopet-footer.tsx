"use client";

import Link from "next/link";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Github, Instagram, Linkedin, MessageCircle, Phone } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { useSupportChat } from "@/providers/support-chat-provider";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslationKey } from "@/lib/i18n/types";

const PHONE = "(83) 99617-5215";
const PHONE_TEL = "+5583996175215";
const WHATSAPP_URL = `https://wa.me/5583996175215`;

type NavLink = { href: string; labelKey: TranslationKey; authRequired?: boolean };

const PRODUCT_LINKS: NavLink[] = [
  { href: "/marketplace", labelKey: "nav.marketplace" },
  { href: "/explorar", labelKey: "nav.explore" },
  { href: "/marketplace/servicos", labelKey: "nav.services" },
  { href: "/social", labelKey: "nav.socialNetwork" },
  { href: "/eccopet", labelKey: "nav.ia" },
];

const ACCOUNT_LINKS: NavLink[] = [
  { href: "/meu-pet", labelKey: "nav.petRegistration" },
  { href: "/perfil", labelKey: "nav.profile" },
  { href: "/adocao", labelKey: "nav.adoption" },
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
    <footer className="relative overflow-hidden border-t border-white/10 bg-ecopet-dark text-white">
      <div
        className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-ecopet-green/20 blur-3xl"
        aria-hidden
      />
      <div className="ep-container relative max-w-6xl py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <EcoPetLogo href="/" variant="dark" size="lg" showText />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">{t("footer.tagline")}</p>
            <div className="mt-6 flex items-center gap-2">
              {[
                { href: WHATSAPP_URL, label: "WhatsApp", icon: MessageCircle },
                { href: "https://instagram.com", label: "Instagram", icon: Instagram },
                { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
                { href: "https://github.com", label: "GitHub", icon: Github },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                >
                  <s.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h3 className="overline-text text-white/50">{t("common.navigation")}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={resolveHref(link, isAuthenticated)}
                      className="text-white/75 transition hover:text-white"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="overline-text text-white/50">EcoPet</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={resolveHref(link, isAuthenticated)}
                      className="text-white/75 transition hover:text-white"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="overline-text text-white/50">{t("common.contact")}</h3>
              <ul className="mt-4 space-y-4 text-sm text-white/75">
                <li>
                  <span className="block text-xs uppercase tracking-wide text-white/45">{t("common.phone")}</span>
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="mt-1 inline-flex min-h-[44px] items-center gap-2 hover:text-white"
                  >
                    <Phone className="h-4 w-4 text-ecopet-green-500" strokeWidth={2} aria-hidden />
                    {PHONE}
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openChat}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-ecopet-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ecopet-green-700 sm:w-auto"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                    {t("common.support")}
                    {hasUnread ? (
                      <span className="ml-1 h-2 w-2 rounded-full bg-red-500" aria-label={t("footer.newMessage")} />
                    ) : null}
                  </button>
                  <p className="mt-2 text-xs text-white/45">{t("footer.chatHint")}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.copyright", { year: String(new Date().getFullYear()) })}</p>
          <p className="max-w-md text-white/40">{t("footer.about")}</p>
        </div>
      </div>
    </footer>
  );
}
