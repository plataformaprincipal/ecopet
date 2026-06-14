"use client";

import { AppHeader } from "@/components/layouts/app-header";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { GestorSidebar, GestorGuard } from "@/components/features/gestor/gestor-shell";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/providers/i18n-provider";

/**
 * Gestor usa exclusivamente ecopet-session (Prisma User.role === ADMIN).
 * NextAuth legado permanece apenas em módulos sociais/marketplace antigos — não compartilha guard desta área.
 */
export default function GestorLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useFoundationSession();
  const pathname = usePathname();
  const { t } = useTranslation();

  const isAtivacao = pathname.includes("/gestor/ativacao");
  const showSidebar = !isAtivacao;

  return (
    <>
      <AppHeader title={t("gestor.title")} />
      {loading ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <EcoPetLogo variant="icon" size="md" animated="pulse" />
          <p className="text-sm text-ecopet-gray">{t("gestor.loading")}</p>
        </div>
      ) : (
        <GestorGuard role={role ?? undefined}>
          <div className="mx-auto flex max-w-[1600px]">
            {showSidebar && <GestorSidebar />}
            <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
          </div>
        </GestorGuard>
      )}
    </>
  );
}
