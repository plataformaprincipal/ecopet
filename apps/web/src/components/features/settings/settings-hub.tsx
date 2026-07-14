"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User, Shield, Bell, Eye, Globe, Palette, Plug,
  ChevronRight, Mail, Phone,
} from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeusDadosPanel } from "@/components/features/profile/seus-dados-panel";
import { EcopetWatermark } from "@/components/shared/brand/ecopet-symbol";
import { PersonaTabs } from "@/components/features/profile/shared/persona-tabs";
import { NotificationPreferencesPanel } from "@/components/features/notifications/notification-preferences-panel";
import { LogoutButton } from "@/components/shared/auth/logout-button";
import type { ProfileModule } from "@/lib/profile/types";

const SETTINGS_MODULES: ProfileModule[] = [
  { id: "conta", label: "Seus Dados", icon: User, group: "Principal" },
  { id: "seguranca", label: "Segurança", icon: Shield, group: "Principal" },
  { id: "privacidade", label: "Privacidade", icon: Eye, group: "Principal" },
  { id: "notificacoes", label: "Notificações", icon: Bell, group: "Preferências" },
  { id: "acessibilidade", label: "Acessibilidade", icon: Eye, group: "Preferências" },
  { id: "idiomas", label: "Idiomas", icon: Globe, group: "Preferências" },
  { id: "personalizacao", label: "Personalização", icon: Palette, group: "Preferências" },
  { id: "integracoes", label: "Integrações", icon: Plug, group: "Avançado" },
];

function SettingRow({ label, value, action }: { label: string; value?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-ecopet-gray/10 py-3 last:border-0 dark:border-white/10">
      <span className="text-sm text-ecopet-gray">{label}</span>
      {action ?? <span className="text-sm font-medium">{value}</span>}
    </div>
  );
}

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
      <div className="h-6 w-11 rounded-full bg-ecopet-gray/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-ecopet-green peer-checked:after:translate-x-5" />
    </label>
  );
}

export function SettingsHub() {
  const [active, setActive] = useState("conta");

  return (
    <>
      <AppHeader title="Seus Dados" />
      <main className="relative mx-auto max-w-5xl flex-1 p-4 lg:p-6">
        <EcopetWatermark className="fixed" />

        <div className="relative lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
          <aside className="hidden lg:block">
            <PersonaTabs modules={SETTINGS_MODULES} activeId={active} onChange={setActive} />
          </aside>

          <div className="min-w-0 space-y-4">
            <PersonaTabs modules={SETTINGS_MODULES} activeId={active} onChange={setActive} className="lg:hidden" />

            {active === "conta" && <SeusDadosPanel />}

            {active === "seguranca" && (
              <Card className="card-premium">
                <CardContent className="p-6">
                  <h2 className="heading-3 mb-4">Segurança</h2>
                  <SettingRow
                    label="Autenticação em dois fatores (2FA)"
                    value="Em preparação"
                    action={
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        Em preparação
                      </span>
                    }
                  />
                  <p className="mb-3 text-xs text-ecopet-gray">
                    O 2FA ainda não está disponível. Quando o backend estiver pronto, esta opção será habilitada.
                  </p>
                  <SettingRow
                    label="Sessões ativas"
                    value="Em preparação"
                    action={
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        Em preparação
                      </span>
                    }
                  />
                  <SettingRow label="Dispositivos confiáveis" value="Em preparação" />
                  <SettingRow
                    label="Histórico de acessos"
                    action={
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        Em preparação
                      </span>
                    }
                  />
                  <div className="mt-6 border-t border-ecopet-gray/10 pt-4 dark:border-white/10">
                    <h3 className="mb-2 text-sm font-semibold text-ecopet-dark dark:text-white">Sessão</h3>
                    <p className="mb-3 text-sm text-ecopet-gray">Encerre sua sessão neste dispositivo.</p>
                    <LogoutButton />
                  </div>
                </CardContent>
              </Card>
            )}

            {active === "privacidade" && (
              <Card className="card-premium">
                <CardContent className="p-6">
                  <h2 className="heading-3 mb-4">Privacidade & LGPD</h2>
                  <SettingRow label="Visibilidade do perfil" value="Amigos e seguidores" />
                  <SettingRow label="Permissões de dados" action={<Toggle defaultChecked />} />
                  <SettingRow label="Consentimentos LGPD" value="Atualizados" action={<Button variant="outline" size="sm">Revisar</Button>} />
                  <SettingRow label="Exportar meus dados" action={<Button variant="outline" size="sm">Solicitar</Button>} />
                </CardContent>
              </Card>
            )}

            {active === "notificacoes" && <NotificationPreferencesPanel />}

            {active === "acessibilidade" && (
              <Card className="card-premium">
                <CardContent className="p-6">
                  <h2 className="heading-3 mb-4">Acessibilidade</h2>
                  <SettingRow label="Alto contraste" action={<Toggle />} />
                  <SettingRow label="VLibras" action={<Toggle defaultChecked />} />
                  <SettingRow label="Modo dislexia" action={<Toggle />} />
                  <SettingRow label="Leitor de tela otimizado" value="Ativo" />
                  <Link href="/configuracoes" className="mt-4 inline-flex items-center gap-1 text-sm text-ecopet-green">
                    Barra de acessibilidade global <ChevronRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {active === "idiomas" && (
              <Card className="card-premium">
                <CardContent className="p-6">
                  <h2 className="heading-3 mb-4">Idiomas</h2>
                  {["Português (BR)", "English", "Español"].map((lang) => (
                    <label key={lang} className="flex cursor-pointer items-center gap-3 border-b border-ecopet-gray/10 py-3 last:border-0">
                      <input type="radio" name="lang" defaultChecked={lang.includes("Português")} className="h-4 w-4 accent-ecopet-green" />
                      <span className="text-sm font-medium">{lang}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            )}

            {active === "personalizacao" && (
              <Card className="card-premium">
                <CardContent className="p-6">
                  <h2 className="heading-3 mb-4">Personalização</h2>
                  <SettingRow label="Tema" value="Sistema" action={
                    <select className="rounded-lg border px-2 py-1 text-sm dark:bg-ecopet-dark-card">
                      <option>Claro</option>
                      <option>Escuro</option>
                      <option>Sistema</option>
                    </select>
                  } />
                  <SettingRow label="Layout compacto" action={<Toggle />} />
                  <SettingRow label="Widgets na home" action={<Toggle defaultChecked />} />
                </CardContent>
              </Card>
            )}

            {active === "integracoes" && (
              <Card className="card-premium">
                <CardContent className="p-6">
                  <h2 className="heading-3 mb-4">Integrações</h2>
                  <p className="mb-4 text-sm text-ecopet-gray">
                    Conexões com redes externas ainda estão em preparação. Nada é conectado por estes botões.
                  </p>
                  <SettingRow
                    label="Instagram"
                    action={
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        Em preparação
                      </span>
                    }
                  />
                  <SettingRow
                    label="Google Calendar"
                    action={
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        Em preparação
                      </span>
                    }
                  />
                  <SettingRow
                    label="Apple Health"
                    action={
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        Em preparação
                      </span>
                    }
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
