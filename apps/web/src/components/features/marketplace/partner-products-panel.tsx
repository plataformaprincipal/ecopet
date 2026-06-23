"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { productImageAlt } from "@/lib/accessibility/image-alt";

const CATEGORIES = ["FOOD", "HYGIENE", "TOYS", "ACCESSORIES", "MEDICINE", "HEALTH", "BEDDING", "TRANSPORT", "OTHER"];
const SPECIES = ["DOG", "CAT", "BIRD", "FISH", "RODENT", "REPTILE", "OTHER"];

type ProductForm = {
  name: string;
  shortDescription: string;
  description: string;
  catalogCategory: string;
  subcategory: string;
  brand: string;
  sku: string;
  price: string;
  comparePrice: string;
  stock: string;
  minStock: string;
  unit: string;
  weightGrams: string;
  widthCm: string;
  heightCm: string;
  depthCm: string;
  tags: string;
  speciesTarget: string;
  ageTarget: string;
  sizeTarget: string;
  restrictions: string;
  composition: string;
  usageInstructions: string;
  expiryDate: string;
  observations: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  status: string;
  imageUrl: string;
};

const defaultForm = (): ProductForm => ({
  name: "",
  shortDescription: "",
  description: "",
  catalogCategory: "FOOD",
  subcategory: "",
  brand: "",
  sku: "",
  price: "",
  comparePrice: "",
  stock: "1",
  minStock: "0",
  unit: "",
  weightGrams: "",
  widthCm: "",
  heightCm: "",
  depthCm: "",
  tags: "",
  speciesTarget: "",
  ageTarget: "",
  sizeTarget: "",
  restrictions: "",
  composition: "",
  usageInstructions: "",
  expiryDate: "",
  observations: "",
  pickupAvailable: true,
  deliveryAvailable: true,
  status: "ACTIVE",
  imageUrl: "",
});

function buildPayload(form: ProductForm) {
  const dimensions =
    form.widthCm || form.heightCm || form.depthCm
      ? {
          ...(form.widthCm ? { widthCm: Number(form.widthCm) } : {}),
          ...(form.heightCm ? { heightCm: Number(form.heightCm) } : {}),
          ...(form.depthCm ? { depthCm: Number(form.depthCm) } : {}),
        }
      : undefined;

  const extraDetails = {
    ...(form.ageTarget ? { ageTarget: form.ageTarget } : {}),
    ...(form.sizeTarget ? { sizeTarget: form.sizeTarget } : {}),
    ...(form.restrictions ? { restrictions: form.restrictions } : {}),
    ...(form.composition ? { composition: form.composition } : {}),
    ...(form.usageInstructions ? { usageInstructions: form.usageInstructions } : {}),
    ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
    ...(form.observations ? { observations: form.observations } : {}),
    ...(form.speciesTarget
      ? { speciesTargets: [form.speciesTarget] }
      : {}),
  };

  return {
    name: form.name,
    shortDescription: form.shortDescription || null,
    description: form.description,
    catalogCategory: form.catalogCategory,
    subcategory: form.subcategory || null,
    brand: form.brand || null,
    sku: form.sku || null,
    price: Number(form.price),
    comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
    stock: Number(form.stock),
    minStock: Number(form.minStock) || 0,
    unit: form.unit || null,
    weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
    dimensions,
    tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
    speciesTarget: form.speciesTarget || null,
    pickupAvailable: form.pickupAvailable,
    deliveryAvailable: form.deliveryAvailable,
    extraDetails: Object.keys(extraDetails).length ? extraDetails : null,
    status: form.status,
    images: form.imageUrl ? [form.imageUrl] : undefined,
  };
}

export function PartnerProductsPanel({ mode = "list", productId }: { mode?: "list" | "new" | "edit"; productId?: string }) {
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ProductForm>(defaultForm);

  const load = useCallback(() => {
    fetch("/api/partner/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data.products); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode === "list" || mode === "new") load();
    if (mode === "edit" && productId) {
      fetch(`/api/partner/products/${productId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (!d.success) { setError(d.error?.message ?? "Erro"); return; }
          const p = d.data.product as Record<string, unknown>;
          const dims = (p.dimensions ?? {}) as Record<string, number>;
          const extra = (p.extraDetails ?? {}) as Record<string, string | string[]>;
          setForm({
            ...defaultForm(),
            name: String(p.name ?? ""),
            shortDescription: String(p.shortDescription ?? ""),
            description: String(p.description ?? ""),
            catalogCategory: String(p.catalogCategory ?? "FOOD"),
            subcategory: String(p.subcategory ?? ""),
            brand: String(p.brand ?? ""),
            sku: String(p.sku ?? ""),
            price: String(p.price ?? ""),
            comparePrice: p.comparePrice != null ? String(p.comparePrice) : "",
            stock: String(p.stock ?? "0"),
            minStock: String(p.minStock ?? "0"),
            unit: String(p.unit ?? ""),
            weightGrams: p.weightGrams != null ? String(p.weightGrams) : "",
            widthCm: dims.widthCm != null ? String(dims.widthCm) : "",
            heightCm: dims.heightCm != null ? String(dims.heightCm) : "",
            depthCm: dims.depthCm != null ? String(dims.depthCm) : "",
            tags: Array.isArray(p.tags) ? (p.tags as string[]).join(", ") : "",
            speciesTarget: String(p.speciesTarget ?? (Array.isArray(extra.speciesTargets) ? extra.speciesTargets[0] : "") ?? ""),
            ageTarget: String(extra.ageTarget ?? ""),
            sizeTarget: String(extra.sizeTarget ?? ""),
            restrictions: String(extra.restrictions ?? ""),
            composition: String(extra.composition ?? ""),
            usageInstructions: String(extra.usageInstructions ?? ""),
            expiryDate: String(extra.expiryDate ?? ""),
            observations: String(extra.observations ?? ""),
            pickupAvailable: p.pickupAvailable !== false,
            deliveryAvailable: p.deliveryAvailable !== false,
            status: String(p.status ?? "ACTIVE"),
            imageUrl: Array.isArray(p.images) && (p.images as string[]).length ? String((p.images as string[])[0]) : "",
          });
          setLoading(false);
        });
    }
  }, [mode, productId, load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = mode === "edit" && productId ? `/api/partner/products/${productId}` : "/api/partner/products";
    const method = mode === "edit" ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(form)),
    });
    const data = await res.json();
    if (!data.success) { setError(data.error?.message ?? "Erro"); return; }
    window.location.href = `/dashboard/partner/products/${data.data.product.id}?created=1`;
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/partner/products/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error?.message ?? "Erro ao atualizar status");
  }

  async function removeProduct(id: string) {
    if (!confirm("Remover este produto?")) return;
    const res = await fetch(`/api/partner/products/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error?.message ?? "Erro ao remover");
  }

  if (mode === "new" || mode === "edit") {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <form onSubmit={handleSubmit} className="space-y-3" aria-describedby={error ? "product-form-error" : undefined} noValidate>
            <FormField id="product-name" label="Nome" required>
              <Input id="product-name" placeholder="Digite o nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormField>
            <FormField id="product-short-desc" label="Descrição curta">
              <Input id="product-short-desc" placeholder="Resumo para o catálogo" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
            </FormField>
            <FormField id="product-desc" label="Descrição completa" required>
              <textarea id="product-desc" className="w-full rounded border px-3 py-2 text-sm" rows={3} placeholder="Descrição detalhada do produto" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </FormField>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField id="product-category" label="Categoria" required>
                <select id="product-category" className="w-full rounded border px-3 py-2" value={form.catalogCategory} onChange={(e) => setForm({ ...form, catalogCategory: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField id="product-subcategory" label="Subcategoria">
                <Input id="product-subcategory" placeholder="Ex.: Cama, Brinquedos" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
              </FormField>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField id="product-brand" label="Marca">
                <Input id="product-brand" placeholder="Marca do produto" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </FormField>
              <FormField id="product-sku" label="SKU">
                <Input id="product-sku" placeholder="Código interno" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </FormField>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField id="product-price" label="Preço" required>
                <Input id="product-price" type="number" step="0.01" min="0.01" placeholder="0,00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </FormField>
              <FormField id="product-compare-price" label="Preço promocional">
                <Input id="product-compare-price" type="number" step="0.01" placeholder="Preço anterior (opcional)" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} />
              </FormField>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <FormField id="product-stock" label="Estoque">
                <Input id="product-stock" type="number" min="0" placeholder="Quantidade" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </FormField>
              <FormField id="product-min-stock" label="Estoque mínimo">
                <Input id="product-min-stock" type="number" min="0" placeholder="Alerta de estoque" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
              </FormField>
              <FormField id="product-unit" label="Unidade">
                <Input id="product-unit" placeholder="kg, un, cx" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </FormField>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input type="number" min="1" placeholder="Peso (gramas)" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: e.target.value })} />
              <select className="rounded border px-3 py-2" value={form.speciesTarget} onChange={(e) => setForm({ ...form, speciesTarget: e.target.value })}>
                <option value="">Espécie indicada</option>
                {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input type="number" placeholder="Largura (cm)" value={form.widthCm} onChange={(e) => setForm({ ...form, widthCm: e.target.value })} />
              <Input type="number" placeholder="Altura (cm)" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
              <Input type="number" placeholder="Profundidade (cm)" value={form.depthCm} onChange={(e) => setForm({ ...form, depthCm: e.target.value })} />
            </div>
            <Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Idade indicada" value={form.ageTarget} onChange={(e) => setForm({ ...form, ageTarget: e.target.value })} />
              <Input placeholder="Porte indicado" value={form.sizeTarget} onChange={(e) => setForm({ ...form, sizeTarget: e.target.value })} />
            </div>
            <Input placeholder="Restrições" value={form.restrictions} onChange={(e) => setForm({ ...form, restrictions: e.target.value })} />
            <Input placeholder="Composição" value={form.composition} onChange={(e) => setForm({ ...form, composition: e.target.value })} />
            <Input placeholder="Modo de uso" value={form.usageInstructions} onChange={(e) => setForm({ ...form, usageInstructions: e.target.value })} />
            <Input placeholder="Validade" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            <Input placeholder="Observações" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
            <div className="flex flex-wrap gap-4 text-sm">
              <label htmlFor="product-pickup" className="flex items-center gap-2">
                <input id="product-pickup" type="checkbox" checked={form.pickupAvailable} onChange={(e) => setForm({ ...form, pickupAvailable: e.target.checked })} />
                Retirada no local
              </label>
              <label htmlFor="product-delivery" className="flex items-center gap-2">
                <input id="product-delivery" type="checkbox" checked={form.deliveryAvailable} onChange={(e) => setForm({ ...form, deliveryAvailable: e.target.checked })} />
                Entrega disponível
              </label>
            </div>
            <FormField id="product-status" label="Status">
              <select id="product-status" className="w-full rounded border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Ativo (visível no marketplace)</option>
              <option value="DRAFT">Rascunho</option>
              <option value="INACTIVE">Inativo</option>
              </select>
            </FormField>
            <FileUploadField
              purpose="product_image"
              label="Imagem do produto"
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              accept="image/jpeg,image/png,image/webp"
              previewAlt={form.name ? productImageAlt(form.name, { shortDescription: form.shortDescription }) : "Pré-visualização do item no catálogo EcoPet"}
              fieldId="product-image-upload"
            />
            {error && <p id="product-form-error" className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit">Salvar produto</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p>Carregando...</p>;
  return (
    <div className="space-y-3">
      <Button asChild><Link href="/dashboard/partner/products/new">Criar produto</Link></Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {products.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
      ) : products.map((p) => (
        <Card key={String(p.id)}>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <p className="font-medium">{String(p.name)}</p>
              <p className="text-muted-foreground">R$ {Number(p.price).toFixed(2)} · {String(p.status)} · estoque {String(p.stock)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link href={`/dashboard/partner/products/${String(p.id)}`}>Ver</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href={`/dashboard/partner/products/${String(p.id)}/edit`}>Editar</Link></Button>
              <Button size="sm" variant="outline" onClick={() => toggleStatus(String(p.id), String(p.status))}>
                {String(p.status) === "ACTIVE" ? "Desativar" : "Ativar"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => removeProduct(String(p.id))}>Excluir</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FormField({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}
