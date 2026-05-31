import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthSessionProvider } from "@/providers/session-provider";
import { AuthTokenSync } from "@/providers/auth-token-sync";
import { AccessibilityProvider } from "@/providers/accessibility-provider";
import { SkipLink } from "@/components/accessibility/skip-link";
import { AccessibilityToolbarLazy } from "@/components/accessibility/accessibility-toolbar-lazy";
import { I18nProvider } from "@/providers/i18n-provider";
import { PreferencesSync } from "@/hooks/use-preferences-sync";
import { AriaLiveProvider } from "@/components/accessibility/aria-live-region";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "ECOPET — Ecossistema Pet Inteligente",
  description: "Marketplace, rede social, healthtech e IA para o universo pet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
        <ThemeProvider>
          <AccessibilityProvider>
            <I18nProvider>
              <AriaLiveProvider>
                <AuthSessionProvider>
                  <AuthTokenSync />
                  <PreferencesSync />
                  <SkipLink />
                  <div id="main-content" role="main" tabIndex={-1} className="outline-none">
                    {children}
                  </div>
                  <AccessibilityToolbarLazy />
                </AuthSessionProvider>
              </AriaLiveProvider>
            </I18nProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
