import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import { AuthTokenSync } from "@/providers/auth-token-sync";
import { AccessibilityProvider } from "@/providers/accessibility-provider";
import { SkipLink } from "@/components/shared/accessibility/skip-link";
import { AccessibilityToolbarLazy } from "@/components/shared/accessibility/accessibility-toolbar-lazy";
import { I18nProvider } from "@/providers/i18n-provider";
import { PreferencesSync } from "@/hooks/use-preferences-sync";
import { AriaLiveProvider } from "@/components/shared/accessibility/aria-live-region";
import { EcopetFooter } from "@/components/layouts/ecopet-footer";
import { SupportChatProvider } from "@/providers/support-chat-provider";
import { SupportChatPanel } from "@/components/features/support/support-chat-panel";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://ecopet-web.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ECOPET — Ecossistema Inteligente para Pets",
    template: "%s | ECOPET",
  },
  description:
    "Marketplace pet, saúde animal, rede social, adoção e IA assistiva. Plataforma premium para tutores, parceiros, ONGs e AgroPet.",
  keywords: ["pets", "marketplace pet", "veterinário", "adoção", "pet shop", "ECOPET"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "ECOPET",
    title: "ECOPET — Ecossistema Inteligente para Pets",
    description:
      "Marketplace, saúde animal, rede social e IA em uma plataforma premium para tutores e parceiros.",
    images: [{ url: "/brand/ecopet-logo.png", width: 512, height: 512, alt: "ECOPET" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ECOPET — Ecossistema Inteligente para Pets",
    description: "Marketplace, saúde animal, rede social e IA para quem ama pets.",
    images: ["/brand/ecopet-logo.png"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/ecopet-logo.png", type: "image/png" }],
    apple: [{ url: "/brand/ecopet-logo.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ECOPET",
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
                <AuthSessionProvider>
                  <AuthTokenSync />
                  <PreferencesSync />
                  <SupportChatProvider>
                    <SkipLink />
                    <div className="flex min-h-screen flex-col">
                      <div id="main-content" role="main" tabIndex={-1} className="flex-1 outline-none">
                        {children}
                      </div>
                      <EcopetFooter />
                    </div>
                    <SupportChatPanel />
                    <AccessibilityToolbarLazy />
                  </SupportChatProvider>
                </AuthSessionProvider>
              </AriaLiveProvider>
            </I18nProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
