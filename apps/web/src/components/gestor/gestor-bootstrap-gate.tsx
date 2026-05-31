"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchBootstrapStatus } from "@/lib/auth/api";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

export function GestorBootstrapGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAppStore((s) => s.apiToken);
  const [checking, setChecking] = useState(true);
  const [initialized, setInitialized] = useState(true);
  const [isBootstrapUser, setIsBootstrapUser] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    Promise.all([
      fetchBootstrapStatus(),
      api<{ isBootstrapUser?: boolean; isMasterAdmin?: boolean }>("/api/users/me", { token }),
    ])
      .then(([status, user]) => {
        setInitialized(status.initialized);
        setIsBootstrapUser(!!user.isBootstrapUser && !status.initialized);
        if (!status.initialized && user.isBootstrapUser && !pathname.includes("/gestor/ativacao")) {
          router.replace("/gestor/ativacao");
        }
        if (status.initialized && user.isBootstrapUser) {
          router.replace("/login");
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [token, pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ecopet-green border-t-transparent" />
      </div>
    );
  }

  if (!initialized && !isBootstrapUser && !pathname.includes("/gestor/ativacao")) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <p className="font-display text-xl font-bold">Sistema não inicializado</p>
        <p className="mt-2 text-ecopet-gray">Utilize o usuário temporário de ativação para configurar o Super Administrador Master.</p>
        <Link href="/login" className="mt-4 text-ecopet-green underline">Ir para login</Link>
      </div>
    );
  }

  if (isBootstrapUser && !pathname.includes("/gestor/ativacao")) {
    return null;
  }

  return <>{children}</>;
}
