"use client";

import { useEffect, useState } from "react";
import { fetchRbacRoles, fetchInternalUsers, fetchGestorInvites, createGestorInvite } from "@/lib/gestor/api";
import { GestorError, GestorLoading } from "./gestor-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RbacRole {
  id: string;
  name: string;
  code: string;
  hierarchyLevel: number;
  department?: { name: string };
  permissions: { permission: { code: string; module: string; action: string } }[];
  _count: { assignments: number };
}

export function GestorPermissionsPanel() {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; username?: string; department?: { name: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", roleCode: "gestor_moderacao" });
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  function reload() {
    Promise.all([fetchRbacRoles(), fetchInternalUsers(), fetchGestorInvites().catch(() => [])])
      .then(([r, u]) => { setRoles(r as RbacRole[]); setUsers(u as typeof users); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg("");
    try {
      const res = await createGestorInvite(inviteForm) as { tempPassword?: string; username?: string };
      setInviteMsg(`Convite enviado para ${inviteForm.email}${res.tempPassword ? ` · Dev senha: ${res.tempPassword}` : ""}`);
      setInviteForm({ name: "", email: "", roleCode: inviteForm.roleCode });
      reload();
    } catch (err) {
      setInviteMsg(err instanceof Error ? err.message : "Erro ao convidar");
    } finally {
      setInviteLoading(false);
    }
  }

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convidar usuário interno</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Nome" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required />
            <Input placeholder="E-mail" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required />
            <select
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-2 dark:bg-ecopet-dark-card"
              value={inviteForm.roleCode}
              onChange={(e) => setInviteForm({ ...inviteForm, roleCode: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.code}>{r.name}</option>
              ))}
            </select>
            <Button type="submit" disabled={inviteLoading} className="sm:col-span-2">
              {inviteLoading ? "Enviando..." : "Criar usuário e enviar convite"}
            </Button>
          </form>
          {inviteMsg && <p className="mt-3 text-sm text-ecopet-gray">{inviteMsg}</p>}
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-3 font-display font-bold">Usuários internos ECOPET</h3>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-ecopet-gray">{u.email} {u.username && `· @${u.username}`}</p>
              </div>
              {u.department && <Badge variant="outline">{u.department.name}</Badge>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display font-bold">Cargos & Matriz de Permissões</h3>
        <div className="space-y-4">
      {roles.map((role) => (
        <article key={role.id} className="card-premium rounded-[16px] border border-ecopet-gray/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">{role.name}</h3>
              <p className="text-xs text-ecopet-gray">{role.code} · Nível {role.hierarchyLevel}</p>
            </div>
            <Badge>{role._count.assignments} usuários</Badge>
          </div>
          {role.department && <p className="mt-1 text-sm text-ecopet-gray">Dept: {role.department.name}</p>}
          <div className="mt-3 flex flex-wrap gap-1">
            {role.permissions.slice(0, 12).map((p) => (
              <Badge key={p.permission.code} variant="outline" className="text-[10px]">{p.permission.code}</Badge>
            ))}
            {role.permissions.length > 12 && (
              <Badge variant="secondary" className="text-[10px]">+{role.permissions.length - 12}</Badge>
            )}
          </div>
        </article>
      ))}
        </div>
      </section>
    </div>
  );
}
