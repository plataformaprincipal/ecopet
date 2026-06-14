"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";

export function PartnerProductsPanel({ mode = "list", productId }: { mode?: "list" | "new" | "edit"; productId?: string }) {
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", catalogCategory: "FOOD", price: "", stock: "0", status: "DRAFT", imageUrl: "" });

  const load = useCallback(() => {
    fetch("/api/partner/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data.products); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (mode === "list" || mode === "new") load(); }, [mode, load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = mode === "edit" && productId ? `/api/partner/products/${productId}` : "/api/partner/products";
    const method = mode === "edit" ? "PUT" : "POST";
    const res = await fetch(url, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, description: form.description, catalogCategory: form.catalogCategory,
        price: Number(form.price), stock: Number(form.stock), status: form.status,
        images: form.imageUrl ? [form.imageUrl] : undefined,
      }),
    });
    const data = await res.json();
    if (!data.success) { setError(data.error?.message ?? "Erro"); return; }
    window.location.href = `/dashboard/partner/products/${data.data.product.id}`;
  }

  if (mode === "new" || mode === "edit") {
    return (
      <Card><CardContent className="space-y-3 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Input type="number" step="0.01" placeholder="Preço" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input type="number" placeholder="Estoque" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
          <select className="w-full rounded border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="DRAFT">Rascunho</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option>
          </select>
          <FileUploadField
            purpose="product_image"
            label="Imagem do produto"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            accept="image/jpeg,image/png,image/webp"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent></Card>
    );
  }

  if (loading) return <p>Carregando...</p>;
  return (
    <div className="space-y-3">
      <Button asChild><Link href="/dashboard/partner/products/new">Novo produto</Link></Button>
      {products.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
      ) : products.map((p) => (
        <Card key={String(p.id)}><CardContent className="flex justify-between p-4 text-sm">
          <span>{String(p.name)} — {String(p.status)} — estoque {String(p.stock)}</span>
          <Link href={`/dashboard/partner/products/${String(p.id)}`} className="underline">Ver</Link>
        </CardContent></Card>
      ))}
    </div>
  );
}
