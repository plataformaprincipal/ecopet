"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Edit, Pause, Play, Copy, Trash2, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMpPrice } from "@/lib/marketplace/config";
import { MOCK_PRODUCTS } from "@/lib/marketplace/mock-data";
import type { MarketplaceProduct } from "@/lib/marketplace/types";

export function PartnerProductManager() {
  const [products, setProducts] = useState(MOCK_PRODUCTS.slice(0, 6));
  const [showForm, setShowForm] = useState(false);

  function toggleStatus(id: string) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, inStock: !p.inStock } : p));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Gestão de Produtos</h3>
          <p className="text-sm text-ecopet-gray">Cadastro, estoque, variações, promoções e destaque</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Cadastrar produto</Button>
      </div>

      {showForm && <ProductForm onClose={() => setShowForm(false)} />}

      <div className="overflow-x-auto rounded-[16px] border border-ecopet-gray/10">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-ecopet-gray/5">
            <tr>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-left">Categoria</th>
              <th className="p-3 text-right">Preço</th>
              <th className="p-3 text-center">Estoque</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow key={p.id} product={p} onToggle={() => toggleStatus(p.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({ product, onToggle }: { product: MarketplaceProduct; onToggle: () => void }) {
  return (
    <tr className="border-t border-ecopet-gray/10 hover:bg-ecopet-gray/5">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-lg">
            <Image src={product.images[0]} alt="" fill className="object-cover" />
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-xs text-ecopet-gray">{product.brand ?? "—"} · SKU mock</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-ecopet-gray">{product.category}</td>
      <td className="p-3 text-right font-semibold">{formatMpPrice(product.price)}</td>
      <td className="p-3 text-center">
        <Badge variant={product.inStock ? "verified" : "secondary"}>{product.inStock ? "Ativo" : "Pausado"}</Badge>
      </td>
      <td className="p-3 text-center">
        {product.isPromo && <Badge variant="premium">Promo</Badge>}
        {product.isSponsored && <Badge className="ml-1">Destaque</Badge>}
      </td>
      <td className="p-3">
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Editar"><Edit className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" title={product.inStock ? "Pausar" : "Ativar"} onClick={onToggle}>
            {product.inStock ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" title="Duplicar"><Copy className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" title="Destacar"><Star className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </td>
    </tr>
  );
}

function ProductForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="card-premium space-y-4 rounded-[16px] border border-ecopet-green/20 p-4 lg:p-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-ecopet-green" />
        <h4 className="font-semibold">Novo produto</h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {["Nome", "Categoria", "Subcategoria", "Marca", "Preço", "Preço promocional", "Estoque", "SKU", "Peso", "Espécie", "Porte", "Prazo entrega"].map((label) => (
          <div key={label}>
            <label className="mb-1 block text-xs font-medium text-ecopet-gray">{label}</label>
            <Input placeholder={label} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button>Salvar produto</Button>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
}
