"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Props = {
  onMenuToggle?: () => void;
};

export function AdminShellHeader({ onMenuToggle }: Props) {
  const { data: session } = useSession();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur dark:bg-gray-950/95 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar usuários…"
            className="pl-9"
            aria-label="Busca global"
          />
        </div>
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Notificações" asChild>
          <Link href="/admin/audit">
            <Bell className="h-5 w-5" />
          </Link>
        </Button>
        <Link
          href="/perfil"
          className="flex items-center gap-2 rounded-full border px-2 py-1 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ecopet-green/15 text-sm font-semibold text-ecopet-green">
            {(session?.user?.name?.[0] ?? "A").toUpperCase()}
          </span>
          <span className="hidden max-w-[120px] truncate sm:inline">{session?.user?.name ?? "Admin"}</span>
        </Link>
      </div>
    </header>
  );
}
