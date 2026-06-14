"use client";

import Link from "next/link";
import { ShoppingBag, FileText, MessageCircle, Heart, Calendar, Wallet, Sparkles, PawPrint } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";
import { ProfileSection } from "@/components/features/profile/shared/smart-widgets";
import { CustomQuoteCard } from "../quotes/custom-quote-card";
import { ChatHub } from "../chat/chat-hub";
import { getQuotesForClient } from "@/lib/ecosystem/quotes-api";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientOverviewModule } from "@/components/features/profile/client/client-modules";

export function ClientFunctionalDashboard() {
  const { t } = useTranslation();
  const quotes = getQuotesForClient();
  const { addQuoteToCart } = useMarketplaceStore();

  const modules = [
    { icon: ShoppingBag, label: "Compras", href: "/marketplace/carrinho", desc: "Pedidos e histórico" },
    { icon: FileText, label: "Orçamentos", href: "/marketplace/orcamentos", desc: "Recebidos e aceitos" },
    { icon: MessageCircle, label: "Chats", href: "/marketplace/chat", desc: "Parceiros e suporte" },
    { icon: Heart, label: "Favoritos", href: "/marketplace/favoritos", desc: "Produtos e parceiros" },
    { icon: Calendar, label: "Agenda", href: "/agenda", desc: "Serviços agendados" },
    { icon: Wallet, label: "Carteira", href: "/perfil?category=CLIENT", desc: "Assinaturas e cashback" },
    { icon: PawPrint, label: "Meus pets", href: "/meu-pet", desc: "Central pet" },
    { icon: Sparkles, label: "IA pessoal", href: "/ia", desc: "Assistente ECOPET" },
  ];

  return (
    <div className="space-y-6">
      <ClientOverviewModule />

      <ProfileSection title="Acesso rápido">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <Link key={m.label} href={m.href} className="flex items-start gap-3 rounded-[16px] border border-ecopet-gray/10 p-4 transition-all hover:-translate-y-0.5 hover:border-ecopet-green/30 hover:shadow-md">
              <m.icon className="h-5 w-5 shrink-0 text-ecopet-green" />
              <div>
                <p className="font-semibold">{m.label}</p>
                <p className="text-xs text-ecopet-gray">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </ProfileSection>

      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">Orçamentos ({quotes.length})</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>
        <TabsContent value="quotes" className="space-y-4 mt-4">
          {quotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("empty.quotes.noQuotes")}
              description={t("empty.quotes.noQuotesHint")}
              actionLabel={t("common.viewMarketplace")}
              actionHref="/marketplace"
            />
          ) : (
            quotes.map((q) => (
              <CustomQuoteCard key={q.id} quote={q} onAddToCart={addQuoteToCart} />
            ))
          )}
        </TabsContent>
        <TabsContent value="chats" className="mt-4">
          <ChatHub role="client" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
