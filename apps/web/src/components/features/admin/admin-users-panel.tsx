"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminAlert } from "./admin-alert";
import { AdminEmptyState } from "./ui/admin-empty-state";
import { AdminStatusBadge } from "./ui/admin-status-badge";
import { fetchGestorSection } from "@/lib/gestor/client-api";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  city: string | null;
  state: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  petsCount: number;
  ordersCount: number;
  postsCount: number;
};

export function AdminUsersPanel() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: "15" };
      if (q.trim()) params.q = q.trim();
      if (role) params.role = role;
      if (status) params.status = status;
      if (city.trim()) params.city = city.trim();
      if (dateFrom) params.dateFrom = dateFrom;
      const data = await fetchGestorSection("users", params);
      setRows((data.items as UserRow[]) ?? []);
      const pagination = data.pagination as { pages?: number } | undefined;
      setTotalPages(pagination?.pages ?? 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, q, role, status, city, dateFrom]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(userId: string, action: "suspend" | "reactivate") {
    setBusyId(userId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/gestor/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Erro ao atualizar status");
      setSuccess(action === "suspend" ? "Usuário suspenso." : "Usuário reativado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Usuários"
        description="Busca, filtros, paginação e gestão de contas."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Usuários" }]}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void load();
          }}
        >
          <Input
            aria-label="Buscar por nome ou e-mail"
            placeholder="Nome ou e-mail"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Input
            aria-label="Filtrar por cidade"
            placeholder="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="max-w-[140px]"
          />
          <Input
            aria-label="Cadastro a partir de"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="max-w-[160px]"
          />
          <select
            aria-label="Filtrar por role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas as roles</option>
            <option value="CLIENT">Cliente</option>
            <option value="PARTNER">Parceiro</option>
            <option value="ONG">ONG</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PENDING">Pendente</option>
            <option value="SUSPENDED">Suspenso</option>
            <option value="REJECTED">Rejeitado</option>
          </select>
          <Button type="submit">Buscar</Button>
        </form>

        {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess("")} />}
        {error && <AdminAlert type="error" message={error} onDismiss={() => setError("")} />}

        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando usuários…
          </p>
        )}

        {!loading && rows.length === 0 && (
          <AdminEmptyState title="Nenhum usuário encontrado" description="Ajuste os filtros e tente novamente." />
        )}

        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border bg-white dark:bg-white/5">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3">Último login</th>
                  <th className="px-4 py-3">Pedidos</th>
                  <th className="px-4 py-3">Pets</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3">{row.role}</td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={row.accountStatus} />
                    </td>
                    <td className="px-4 py-3">{row.city ?? "—"}</td>
                    <td className="px-4 py-3">{new Date(row.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3">{row.ordersCount}</td>
                    <td className="px-4 py-3">{row.petsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/audit?q=${row.id}`}>Logs</Link>
                        </Button>
                        {row.accountStatus === "ACTIVE" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === row.id}
                            onClick={() => void updateStatus(row.id, "suspend")}
                          >
                            Suspender
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === row.id}
                            onClick={() => void updateStatus(row.id, "reactivate")}
                          >
                            Reativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
