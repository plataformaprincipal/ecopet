"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  status: string;
  usageLimit: number;
  sortOrder: number;
  badge: string | null;
  capabilityId: string;
  pricesConfirmedAt: string | null;
  priceInCents: number;
  priceSource: string;
  sales: number;
  executions: number;
  revenue: number;
  aiCostUsd: number;
  marginApprox: number;
};

export function AdminAiProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch("/api/admin/ai/products", { credentials: "include" });
    const d = await r.json();
    if (d.success) setRows(d.data.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/ai/products/${editing.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editing.name,
        shortDescription: editing.shortDescription,
        longDescription: editing.longDescription,
        status: editing.status,
        usageLimit: editing.usageLimit,
        sortOrder: editing.sortOrder,
        badge: editing.badge,
        priceInCents: editing.priceInCents,
        confirmPrice: editing.priceSource !== "ADMIN_CONFIRMED",
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      setMsg(data.error?.message ?? "Não foi possível salvar.");
      return;
    }
    setEditing(null);
    await load();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Produtos de IA</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Alterar preço cria uma nova versão. Pedidos antigos conservam o valor cobrado.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nome</th>
              <th>Preço</th>
              <th>Status</th>
              <th>Vendas</th>
              <th>Utilizações</th>
              <th>Faturamento</th>
              <th>Custo IA</th>
              <th>Margem aprox.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="font-mono text-xs">{r.sku}</td>
                <td>{r.name}</td>
                <td>R$ {(r.priceInCents / 100).toFixed(2)}</td>
                <td>{r.status}</td>
                <td>{r.sales}</td>
                <td>{r.executions}</td>
                <td>R$ {r.revenue.toFixed(2)}</td>
                <td>USD {r.aiCostUsd.toFixed(4)}</td>
                <td>R$ {r.marginApprox.toFixed(2)}</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <form
          className="mt-8 max-w-xl space-y-3 rounded-2xl border p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h2 className="text-lg font-semibold">Editar {editing.sku}</h2>
          <label className="block text-sm">
            Nome
            <input
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Descrição curta
            <textarea
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              value={editing.shortDescription}
              onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Descrição
            <textarea
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              rows={4}
              value={editing.longDescription}
              onChange={(e) => setEditing({ ...editing, longDescription: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Status
            <select
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <label className="block text-sm">
            Preço (centavos)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              value={editing.priceInCents}
              onChange={(e) => setEditing({ ...editing, priceInCents: Number(e.target.value) })}
            />
          </label>
          <label className="block text-sm">
            Limite de usos por compra
            <input
              type="number"
              min={1}
              max={20}
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              value={editing.usageLimit}
              onChange={(e) => setEditing({ ...editing, usageLimit: Number(e.target.value) })}
            />
          </label>
          <label className="block text-sm">
            Badge
            <input
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              value={editing.badge ?? ""}
              onChange={(e) => setEditing({ ...editing, badge: e.target.value || null })}
            />
          </label>
          <label className="block text-sm">
            Ordem
            <input
              type="number"
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"
              value={editing.sortOrder}
              onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
            />
          </label>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              Salvar nova versão
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/ai/executions">Execuções</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/ai/commerce-metrics">Métricas</Link>
        </Button>
      </div>
    </div>
  );
}
