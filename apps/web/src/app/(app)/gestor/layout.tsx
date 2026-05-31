"use client";

import { AppHeader } from "@/components/layout/app-header";
import { GestorSidebar, GestorGuard, GestorPasswordGate } from "@/components/gestor/gestor-shell";
import { GestorBootstrapGate } from "@/components/gestor/gestor-bootstrap-gate";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, token } = useCurrentUser();
  const pathname = usePathname();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isBootstrapFlow, setIsBootstrapFlow] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<{ mustChangePassword?: boolean; isBootstrapUser?: boolean }>("/api/users/me", { token })
      .then((u) => {
        setMustChangePassword(!!u.mustChangePassword);
        setIsBootstrapFlow(!!u.isBootstrapUser);
      })
      .catch(() => {});
  }, [token]);

  const isAtivacao = pathname.includes("/gestor/ativacao");
  const showSidebar = !mustChangePassword && !isAtivacao && !isBootstrapFlow;

  return (
    <>
      <AppHeader title="Gestor ECOPET" />
      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ecopet-green border-t-transparent" />
        </div>
      ) : (
        <GestorGuard role={user?.role}>
          <GestorBootstrapGate>
            <GestorPasswordGate mustChangePassword={mustChangePassword && !isAtivacao}>
              <div className="mx-auto flex max-w-[1600px]">
                {showSidebar && <GestorSidebar />}
                <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
              </div>
            </GestorPasswordGate>
          </GestorBootstrapGate>
        </GestorGuard>
      )}
    </>
  );
}
