import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import { AuthGateProvider } from "@/providers/auth-gate-provider";
import { AuthTokenSync } from "@/providers/auth-token-sync";
import { AccessibilityProvider } from "@/providers/accessibility-provider";
import { SkipLink } from "@/components/shared/accessibility/skip-link";
import { GlobalAccessibility } from "@/components/shared/accessibility/global-accessibility";
import { I18nProvider } from "@/providers/i18n-provider";
import { PreferencesSync } from "@/hooks/use-preferences-sync";
import { AriaLiveProvider } from "@/components/shared/accessibility/aria-live-region";
import { EcopetFooter } from "@/components/layouts/ecopet-footer";
import { SupportChatProvider } from "@/providers/support-chat-provider";
import { SupportChatPanelLazy } from "@/components/features/support/support-chat-panel-lazy";
import { ForegroundNotificationListener } from "@/components/notifications/foreground-notification-listener";
import { GoogleAnalyticsProvider } from "@/providers/google-analytics-provider";
import { GoogleTagManagerProvider } from "@/providers/google-tag-manager-provider";
import { ConsentBanner } from "@/components/shared/consent/consent-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://ecopet-web.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "EccoPet — Tudo para a vida do seu pet, em um só lugar",
    template: "%s | EccoPet",
  },
  description:
    "Compras, serviços, saúde, comunidade, adoção e inteligência artificial conectados pela EccoPet.",
  keywords: ["pets", "marketplace pet", "veterinário", "adoção", "pet shop", "EccoPet"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "EccoPet",
    title: "EccoPet — Tudo para a vida do seu pet, em um só lugar",
    description:
      "Compras, serviços, saúde, comunidade, adoção e inteligência artificial conectados pela EccoPet.",
    images: [{ url: "/brand/ecopet-logo.png", width: 512, height: 512, alt: "EccoPet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EccoPet — Tudo para a vida do seu pet, em um só lugar",
    description: "Compras, serviços, saúde, comunidade, adoção e IA conectados pela EccoPet.",
    images: ["/brand/ecopet-logo.png"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/ecopet-mark.svg", type: "image/svg+xml" },
      { url: "/brand/ecopet-logo.png", type: "image/png" },
    ],
    apple: [{ url: "/brand/ecopet-icon-192.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EccoPet",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003B16" },
    { media: "(prefers-color-scheme: dark)", color: "#003B16" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AccessibilityProvider>
            <I18nProvider>
              <AriaLiveProvider>
                <GoogleTagManagerProvider>
                  <GoogleAnalyticsProvider>
                    <AuthSessionProvider>
                      <AuthGateProvider>
                        <AuthTokenSync />
                        <PreferencesSync />
                        <ForegroundNotificationListener />
                        <SupportChatProvider>
                          <SkipLink />
                          <div className="flex min-h-screen flex-col">
                            <div id="main-content" role="main" tabIndex={-1} className="flex-1 outline-none">
                              {children}
                            </div>
                            <EcopetFooter />
                          </div>
                          <SupportChatPanelLazy />
                          <ConsentBanner />
                        </SupportChatProvider>
                      </AuthGateProvider>
                    </AuthSessionProvider>
                    {/*
                      Acessibilidade global — fora de AuthGate/SupportChat.
                      Aparece em todas as rotas, antes e depois do login, sem depender de role.
                    */}
                    <GlobalAccessibility />
                  </GoogleAnalyticsProvider>
                </GoogleTagManagerProvider>
              </AriaLiveProvider>
            </I18nProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
