"use client";

import Link from "next/link";
import { HandHeart, Heart, MessageCircle, BarChart3, Users, Shield, FileText, Sparkles } from "lucide-react";
import { ProfileSection } from "@/components/profile/shared/smart-widgets";
import { NGOOverviewModule } from "@/components/profile/ngo/ngo-modules";
import { ChatHub } from "../chat/chat-hub";
import { EcoPetInsightsDashboard } from "../insights/ecopet-insights-dashboard";
import { AccessManagementPanel } from "../partner/access-management-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NGOFunctionalDashboard() {
  const modules = [
    { icon: HandHeart, label: "Campanhas", href: "/perfil?category=NGO", desc: "Doações e metas" },
    { icon: Heart, label: "Adoções", href: "/adocao", desc: "Animais disponíveis" },
    { icon: Shield, label: "Resgates", href: "/perfil?category=NGO", desc: "Operações de campo" },
    { icon: Users, label: "Voluntários", href: "/perfil?category=NGO", desc: "Equipe e turnos" },
    { icon: MessageCircle, label: "Chats", href: "/marketplace/chat?role=ngo", desc: "Adotantes e parceiros" },
    { icon: BarChart3, label: "Métricas", href: "/insights?scope=ngo", desc: "Impacto e transparência" },
    { icon: FileText, label: "Prestação de contas", href: "/perfil?category=NGO", desc: "Relatórios públicos" },
    { icon: Sparkles, label: "IA Social", href: "/ia", desc: "Campanhas inteligentes" },
  ];

  return (
    <div className="space-y-6">
      <NGOOverviewModule />

      <ProfileSection title="Módulos operacionais">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <Link key={m.label} href={m.href} className="flex items-start gap-3 rounded-[16px] border border-ecopet-gray/10 p-4 transition-all hover:-translate-y-0.5 hover:border-ecopet-green/30">
              <m.icon className="h-5 w-5 shrink-0 text-ecopet-green" />
              <div>
                <p className="font-semibold">{m.label}</p>
                <p className="text-xs text-ecopet-gray">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </ProfileSection>

      <Tabs defaultValue="chats">
        <TabsList className="flex-wrap">
          <TabsTrigger value="chats">Chats ONG</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="access">Níveis de acesso</TabsTrigger>
        </TabsList>
        <TabsContent value="chats" className="mt-4"><ChatHub role="ngo" /></TabsContent>
        <TabsContent value="metrics" className="mt-4"><EcoPetInsightsDashboard scope="ngo" /></TabsContent>
        <TabsContent value="access" className="mt-4"><AccessManagementPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
