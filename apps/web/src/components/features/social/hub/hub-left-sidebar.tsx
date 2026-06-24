"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  PawPrint,
  Users,
  Compass,
  ShoppingBag,
  Scissors,
  Heart,
  Building2,
  Store,
  CalendarDays,
  Sparkles,
  Plus,
  ShoppingCart,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: LucideIcon };

const NAV_LINKS: NavLink[] = [
  { href: "/perfil", label: "Meu Perfil", icon: User },
  { href: "/meu-pet", label: "Meu Pet", icon: PawPrint },
  { href: "/feed", label: "Comunidade", icon: Users },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/adocao", label: "Adoção", icon: Heart },
  { href: "/adocao", label: "ONGs", icon: Building2 },
  { href: "/marketplace/parceiros", label: "Parceiros", icon: Store },
  { href: "/explorar", label: "Eventos", icon: CalendarDays },
  { href: "/eccopet", label: "EccoPet AI", icon: Sparkles },
];

const SHORTCUTS: NavLink[] = [
  { href: "/carrinho", label: "Carrinho", icon: ShoppingCart },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/dashboard/messages", label: "Mensagens", icon: Users },
];

export function HubLeftSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const pets = user?.pets ?? [];

  return (
    <aside className={cn("space-y-4", className)} aria-label="Navegação da rede social">
      {user ? (
        <div className="rounded-[20px] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-ecopet-green/20">
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-900 dark:text-white">{user.name}</p>
              <Link href="/perfil" className="text-xs text-ecopet-green hover:underline">
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="rounded-[20px] border border-zinc-200/80 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        <ul>
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-ecopet-green/10 text-ecopet-green"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-[20px] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Meus pets</h3>
          <Link href="/meu-pet" className="text-ecopet-green" aria-label="Adicionar pet">
            <Plus className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {pets.length === 0 ? (
          <p className="text-xs text-zinc-500">Cadastre seu primeiro pet em Meu Pet.</p>
        ) : (
          <ul className="space-y-2">
            {pets.slice(0, 4).map((pet) => (
              <li key={pet.id}>
                <Link href="/meu-pet" className="flex items-center gap-2 text-sm text-zinc-600 hover:text-ecopet-green dark:text-zinc-300">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={pet.photo ?? undefined} alt="" />
                    <AvatarFallback>{pet.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{pet.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[20px] border border-zinc-200/80 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Atalhos rápidos</h3>
        <ul>
          {SHORTCUTS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-[20px] bg-gradient-to-br from-ecopet-green to-emerald-700 p-4 text-white">
        <Heart className="h-6 w-6 text-ecopet-yellow" aria-hidden />
        <h3 className="mt-2 text-sm font-semibold">Campanha em destaque</h3>
        <p className="mt-1 text-xs text-white/85">Ajude ONGs parceiras a encontrar lares para animais resgatados.</p>
        <Link
          href="/adocao"
          className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ecopet-dark hover:bg-ecopet-cream"
        >
          Conhecer adoções
        </Link>
      </div>
    </aside>
  );
}
