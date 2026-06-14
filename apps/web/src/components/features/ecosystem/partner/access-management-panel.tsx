"use client";

import { useState } from "react";
import { UserPlus, Shield, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileSection } from "@/components/features/profile/shared/smart-widgets";
import { EmptyState } from "@/components/ui/empty-state";
import { PERMISSION_CATEGORIES } from "@/lib/ecosystem/config";
import type { AccessRole, TeamMember } from "@/lib/ecosystem/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

const ROLE_LABELS: Record<AccessRole, string> = {
  owner: "Proprietário", admin: "Administrador", manager: "Gerente",
  operator: "Operador", viewer: "Visualizador", guest: "Convidado",
};

export function PermissionMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-xs">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Categoria</th>
            {["view", "create", "edit", "delete", "approve", "export", "configure", "admin"].map((a) => (
              <th key={a} className="p-2 text-center capitalize">{a === "view" ? "Ver" : a === "create" ? "Criar" : a === "edit" ? "Editar" : a === "delete" ? "Excluir" : a === "approve" ? "Aprovar" : a === "export" ? "Exportar" : a === "configure" ? "Config" : "Admin"}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_CATEGORIES.map((cat) => (
            cat.permissions.map((perm) => (
              <tr key={perm.id} className="border-b hover:bg-ecopet-gray/5">
                <td className="p-2 font-medium">{perm.label}</td>
                {["view", "create", "edit", "delete", "approve", "export", "configure", "admin"].map((action) => (
                  <td key={action} className="p-2 text-center">
                    {(perm.actions as readonly string[]).includes(action) ? (
                      <input type="checkbox" defaultChecked={action === "view"} className="accent-ecopet-green" />
                    ) : <span className="text-ecopet-gray/30">—</span>}
                  </td>
                ))}
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccessManagementPanel() {
  const { t } = useTranslation();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const teamMembers: TeamMember[] = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Gestão de Acessos</h3>
          <p className="text-sm text-ecopet-gray">Membros, permissões por setor e logs de segurança</p>
        </div>
        <Button><UserPlus className="h-4 w-4" /> Convidar membro</Button>
      </div>

      <ProfileSection title="Membros da equipe">
        {teamMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("empty.profiles.title")}
            description={t("empty.profiles.description")}
          />
        ) : (
          <div className="space-y-2">
            {teamMembers.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border border-ecopet-gray/10 p-3 transition-colors",
                  selectedMember === m.id && "border-ecopet-green bg-ecopet-green/5"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ecopet-green/10 font-semibold text-ecopet-green">
                  {m.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-ecopet-gray">{m.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline">{ROLE_LABELS[m.role]}</Badge>
                    <Badge variant="secondary">{m.sector}</Badge>
                    <Badge variant={m.status === "active" ? "verified" : "secondary"}>{m.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setSelectedMember(m.id === selectedMember ? null : m.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      {selectedMember && (
        <ProfileSection title="Matriz de permissões">
          <PermissionMatrix />
        </ProfileSection>
      )}

      <ProfileSection title="Logs de acesso recentes">
        <EmptyState
          icon={Shield}
          title={t("empty.admin.noData")}
          description={t("empty.admin.noData")}
        />
      </ProfileSection>
    </div>
  );
}
