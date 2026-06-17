"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { serviceImageAlt } from "@/lib/accessibility/image-alt";

const CATEGORIES = [
  "BATH_GROOMING", "VET_CONSULTATION", "VACCINATION", "DOG_WALKER",
  "PET_SITTER", "TRAINING", "BOARDING", "PET_TRANSPORT",
];
const MODALITIES = ["IN_PERSON", "HOME", "ONLINE", "PICKUP_DELIVERY"];
const SPECIES = ["DOG", "CAT", "BIRD", "FISH", "RODENT", "REPTILE", "OTHER"];
const BRAZIL_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type Service = { id: string; name: string; description: string; price: number; status: string; category: string; durationMin?: number };

type ServiceForm = {
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  subcategory: string;
  price: string;
  priceOnRequest: boolean;
  durationMin: string;
  modality: string;
  speciesTarget: string;
  sizeTargets: string;
  minAgeYears: string;
  maxAgeYears: string;
  requirements: string;
  requiredDocuments: string;
  petPreparation: string;
  cancellationPolicy: string;
  availability: string;
  serviceLocation: string;
  city: string;
  state: string;
  tags: string;
  observations: string;
  status: string;
  image: string;
};

const defaultForm = (): ServiceForm => ({
  name: "",
  shortDescription: "",
  description: "",
  category: "BATH_GROOMING",
  subcategory: "",
  price: "",
  priceOnRequest: false,
  durationMin: "60",
  modality: "IN_PERSON",
  speciesTarget: "",
  sizeTargets: "",
  minAgeYears: "",
  maxAgeYears: "",
  requirements: "",
  requiredDocuments: "",
  petPreparation: "",
  cancellationPolicy: "",
  availability: "",
  serviceLocation: "",
  city: "",
  state: "",
  tags: "",
  observations: "",
  status: "ACTIVE",
  image: "",
});

function buildPayload(form: ServiceForm) {
  const extraDetails = {
    ...(form.sizeTargets ? { sizeTargets: form.sizeTargets.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
    ...(form.minAgeYears ? { minAgeYears: Number(form.minAgeYears) } : {}),
    ...(form.maxAgeYears ? { maxAgeYears: Number(form.maxAgeYears) } : {}),
    ...(form.requirements ? { requirements: form.requirements } : {}),
    ...(form.requiredDocuments ? { requiredDocuments: form.requiredDocuments } : {}),
    ...(form.petPreparation ? { petPreparation: form.petPreparation } : {}),
    ...(form.cancellationPolicy ? { cancellationPolicy: form.cancellationPolicy } : {}),
    ...(form.availability ? { availability: form.availability } : {}),
    ...(form.observations ? { observations: form.observations } : {}),
  };

  return {
    name: form.name,
    shortDescription: form.shortDescription || null,
    description: form.description,
    category: form.category,
    subcategory: form.subcategory || null,
    price: form.priceOnRequest ? 0 : Number(form.price),
    priceOnRequest: form.priceOnRequest,
    durationMin: Number(form.durationMin),
    modality: form.modality || null,
    speciesTarget: form.speciesTarget || null,
    city: form.city || null,
    state: form.state || null,
    serviceLocation: form.serviceLocation || null,
    tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
    extraDetails: Object.keys(extraDetails).length ? extraDetails : null,
    status: form.status,
    image: form.image || null,
  };
}

export function PartnerServicesPanel({ mode = "list", serviceId }: { mode?: "list" | "new" | "detail" | "edit"; serviceId?: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ServiceForm>(defaultForm);

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/partner/services", { credentials: "include" });
    const data = await res.json();
    if (!data.success) setError(data.error?.message ?? "Erro");
    else setServices(data.data.services);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (mode === "list" || mode === "new") loadList();
    if ((mode === "detail" || mode === "edit") && serviceId) {
      fetch(`/api/partner/services/${serviceId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (!d.success) { setError(d.error?.message ?? "Erro"); return; }
          const s = d.data.service as Record<string, unknown>;
          const extra = (s.extraDetails ?? {}) as Record<string, unknown>;
          setService(s as Service);
          setForm({
            ...defaultForm(),
            name: String(s.name ?? ""),
            shortDescription: String(s.shortDescription ?? ""),
            description: String(s.description ?? ""),
            category: String(s.category ?? "BATH_GROOMING"),
            subcategory: String(s.subcategory ?? ""),
            price: String(s.price ?? ""),
            priceOnRequest: Boolean(s.priceOnRequest),
            durationMin: String(s.durationMin ?? "60"),
            modality: String(s.modality ?? "IN_PERSON"),
            speciesTarget: String(s.speciesTarget ?? ""),
            sizeTargets: Array.isArray(extra.sizeTargets) ? (extra.sizeTargets as string[]).join(", ") : "",
            minAgeYears: extra.minAgeYears != null ? String(extra.minAgeYears) : "",
            maxAgeYears: extra.maxAgeYears != null ? String(extra.maxAgeYears) : "",
            requirements: String(extra.requirements ?? ""),
            requiredDocuments: String(extra.requiredDocuments ?? ""),
            petPreparation: String(extra.petPreparation ?? ""),
            cancellationPolicy: String(extra.cancellationPolicy ?? ""),
            availability: String(extra.availability ?? ""),
            serviceLocation: String(s.serviceLocation ?? ""),
            city: String(s.city ?? ""),
            state: String(s.state ?? ""),
            tags: Array.isArray(s.tags) ? (s.tags as string[]).join(", ") : "",
            observations: String(extra.observations ?? ""),
            status: String(s.status ?? "ACTIVE"),
            image: String(s.image ?? ""),
          });
          setLoading(false);
        });
    }
  }, [mode, serviceId, loadList]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = mode === "edit" && serviceId ? `/api/partner/services/${serviceId}` : "/api/partner/services";
    const method = mode === "edit" ? "PUT" : "POST";
    const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload(form)) });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error?.message ?? "Erro"); return; }
    window.location.href = `/dashboard/partner/services/${data.data.service.id}`;
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/partner/services/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (data.success) loadList();
    else setError(data.error?.message ?? "Erro");
  }

  async function removeService(id: string) {
    if (!confirm("Remover este serviço?")) return;
    const res = await fetch(`/api/partner/services/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (data.success) loadList();
    else setError(data.error?.message ?? "Erro");
  }

  if (mode === "new" || mode === "edit") {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Descrição curta" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={3} placeholder="Descrição completa *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <div className="grid gap-2 sm:grid-cols-2">
              <select className="rounded border px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input placeholder="Subcategoria" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.priceOnRequest} onChange={(e) => setForm({ ...form, priceOnRequest: e.target.checked })} />
              Preço sob consulta
            </label>
            {!form.priceOnRequest && (
              <Input type="number" step="0.01" min="0.01" placeholder="Preço *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            )}
            <Input type="number" min="1" placeholder="Duração (minutos) *" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} required />
            <select className="w-full rounded border px-3 py-2" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
              {MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="w-full rounded border px-3 py-2" value={form.speciesTarget} onChange={(e) => setForm({ ...form, speciesTarget: e.target.value })}>
              <option value="">Espécie atendida</option>
              {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input placeholder="Portes atendidos (separados por vírgula)" value={form.sizeTargets} onChange={(e) => setForm({ ...form, sizeTargets: e.target.value })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input type="number" min="0" placeholder="Idade mínima (anos)" value={form.minAgeYears} onChange={(e) => setForm({ ...form, minAgeYears: e.target.value })} />
              <Input type="number" min="0" placeholder="Idade máxima (anos)" value={form.maxAgeYears} onChange={(e) => setForm({ ...form, maxAgeYears: e.target.value })} />
            </div>
            <Input placeholder="Requisitos prévios" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            <Input placeholder="Documentos necessários" value={form.requiredDocuments} onChange={(e) => setForm({ ...form, requiredDocuments: e.target.value })} />
            <Input placeholder="Preparação do pet" value={form.petPreparation} onChange={(e) => setForm({ ...form, petPreparation: e.target.value })} />
            <Input placeholder="Política de cancelamento" value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} />
            <Input placeholder="Disponibilidade" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
            <Input placeholder="Local de atendimento" value={form.serviceLocation} onChange={(e) => setForm({ ...form, serviceLocation: e.target.value })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <select className="rounded border px-3 py-2" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                <option value="">Estado</option>
                {BRAZIL_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <Input placeholder="Observações" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
            <select className="w-full rounded border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Ativo (visível publicamente)</option>
              <option value="DRAFT">Rascunho</option>
              <option value="INACTIVE">Inativo</option>
            </select>
            <FileUploadField
              purpose="service_image"
              label="Imagem do serviço"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              accept="image/jpeg,image/png,image/webp"
              previewAlt={form.name ? serviceImageAlt(form.name, form.shortDescription) : "Pré-visualização do serviço no catálogo EcoPet"}
              fieldId="service-image-upload"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar serviço"}</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (mode === "detail" && service) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="text-lg font-medium">{service.name}</p>
          <p>{service.description}</p>
          <p>Preço: {service.price > 0 ? `R$ ${service.price.toFixed(2)}` : "Sob consulta"}</p>
          <p>Duração: {service.durationMin ?? 60} min</p>
          <p>Status: {service.status}</p>
          <Button asChild size="sm"><Link href={`/dashboard/partner/services/${service.id}/edit`}>Editar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  return (
    <div className="space-y-4">
      <Button asChild><Link href="/dashboard/partner/services/new">Criar serviço</Link></Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {services.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
      ) : services.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">R$ {s.price.toFixed(2)} · {s.durationMin ?? 60} min · {s.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link href={`/dashboard/partner/services/${s.id}`}>Ver</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href={`/dashboard/partner/services/${s.id}/edit`}>Editar</Link></Button>
              <Button size="sm" variant="outline" onClick={() => toggleStatus(s.id, s.status)}>
                {s.status === "ACTIVE" ? "Desativar" : "Ativar"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => removeService(s.id)}>Excluir</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
