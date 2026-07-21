"use client";

import Link from "next/link";
import { ErpNotificationCenter } from "@/components/features/admin/erp/erp-notification-center";
import { ErpAssistantDrawer } from "@/components/features/admin/erp/erp-assistant-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu } from "lucide-react";
import { useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";

type Props = {
  onMenuToggle?: () => void;
};

export function AdminShellHeader({ onMenuToggle }: Props) {
  const { data: session } = useAuthSession();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ecopet-gray/12 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-ecopet-dark/95 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </Button>
      <form
        className="hidden flex-1 sm:block sm:max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) {
            window.location.href = `/admin/users?q=${encodeURIComponent(q.trim())}`;
          }
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" strokeWidth={2} aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar usuários…"
            className="rounded-[var(--radius-input)] border-ecopet-gray/15 pl-9"
            aria-label="Busca global"
          />
        </div>
      </form>
      <div className="ml-auto flex items-center gap-2">
        <ErpAssistantDrawer />
        <ErpNotificationCenter />
        <Link
          href="/perfil"
          className="flex items-center gap-2 rounded-full border border-ecopet-gray/15 bg-ecopet-cream/40 px-2 py-1 text-sm text-ecopet-dark transition hover:bg-ecopet-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ecopet-green/15 text-sm font-semibold text-ecopet-green">
            {(session?.user?.name?.[0] ?? "A").toUpperCase()}
          </span>
          <span className="hidden max-w-[120px] truncate font-medium sm:inline">{session?.user?.name ?? "Admin"}</span>
        </Link>
      </div>
    </header>
  );
}
