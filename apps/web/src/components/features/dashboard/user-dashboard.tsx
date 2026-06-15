"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  PawPrint,
  Calendar,
  ShoppingBag,
  Bell,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EMPTY_MESSAGES } from "@/lib/auth/routes";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { useNotificationsStore } from "@/store/notifications-store";

export function UserDashboard() {
  const { user, token, loading } = useCurrentUser();
  const cartCount = useMarketplaceStore((s) => s.cartCount());
  const unread = useNotificationsStore((s) => s.unreadCount());

  useEffect(() => {
    if (token) useNotificationsStore.getState().load(token);
  }, [token]);

  if (loading) {
    return (
      <>
        <AppHeader title="Meu ECOPET" />
        <main className="flex-1 p-8 text-center text-sm text-ecopet-gray">Carregando seu painel...</main>
      </>
    );
  }

  if (!user || !token) return null;

  return (
    <>
      <AppHeader title="Meu ECOPET" />
      <main className="mx-auto max-w-4xl flex-1 space-y-6 p-4 lg:p-6">
        <section className="rounded-2xl bg-gradient-to-br from-[#003B16] to-ecopet-green p-6 text-white shadow-lg">
          <p className="text-sm text-white/70">Bem-vindo(a) de volta</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold lg:text-3xl">{user.name}</h1>
          <p className="mt-2 text-sm text-white/80">
            Seu ecossistema personalizado — pets, agendamentos, marketplace e muito mais.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/meu-pet">Meus Pets</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link href="/agenda">Agendar serviço</Link>
            </Button>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Pets", value: user.pets?.length ?? 0, icon: PawPrint, href: "/meu-pet" },
            { label: "Carrinho", value: cartCount, icon: ShoppingBag, href: "/marketplace/carrinho" },
            { label: "Notificações", value: unread, icon: Bell, href: "/notificacoes" },
            { label: "Mensagens", value: "—", icon: MessageCircle, href: "/dashboard/messages" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card className="card-premium h-full transition hover:border-ecopet-green/40 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ecopet-green/10">
                    <item.icon className="h-5 w-5 text-ecopet-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ecopet-dark dark:text-white">{item.value}</p>
                    <p className="text-xs text-ecopet-gray">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {(user.pets?.length ?? 0) === 0 && unread === 0 && cartCount === 0 && (
          <EmptyState
            icon={Sparkles}
            title="Seu espaço está pronto"
            description={EMPTY_MESSAGES.activities}
            actionLabel="Cadastrar pet"
            actionHref="/meu-pet?new=1"
          />
        )}

        {(user.pets?.length ?? 0) === 0 && (unread > 0 || cartCount > 0) && (
          <EmptyState
            icon={PawPrint}
            title="Comece pelo seu pet"
            description={EMPTY_MESSAGES.pets}
            actionLabel="Cadastrar pet"
            actionHref="/meu-pet?new=1"
          />
        )}

        <Card className="card-premium">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 shrink-0 text-ecopet-yellow" />
              <div>
                <h2 className="font-display font-bold">Atalhos rápidos</h2>
                <p className="text-sm text-ecopet-gray">Explore módulos do seu perfil {user.role?.toLowerCase() ?? "tutor"}.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><Link href="/feed">Feed</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/marketplace">Marketplace</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/perfil">Perfil</Link></Button>
              <Button asChild size="sm"><Link href="/ia">ECOPET AI <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
