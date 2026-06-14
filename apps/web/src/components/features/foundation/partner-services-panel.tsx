"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";

type Service = { id: string; name: string; description: string; price: number; status: string; category: string };

export function PartnerServicesPanel({ mode = "list", serviceId }: { mode?: "list" | "new" | "detail" | "edit"; serviceId?: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", category: "BATH_GROOMING", price: "", durationMin: "60", status: "DRAFT", image: "",
  });

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
          if (!d.success) setError(d.error?.message ?? "Erro");
          else {
            const s = d.data.service as Service;
            setService(s);
            setForm({
              name: s.name, description: s.description, category: s.category,
              price: String(s.price), durationMin: "60", status: s.status,
              image: (s as Service & { image?: string }).image ?? "",
            });
          }
          setLoading(false);
        });
    }
  }, [mode, serviceId, loadList]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name, description: form.description, category: form.category,
      price: Number(form.price), durationMin: Number(form.durationMin), status: form.status,
      image: form.image || null,
    };
    const url = mode === "edit" && serviceId ? `/api/partner/services/${serviceId}` : "/api/partner/services";
    const method = mode === "edit" ? "PUT" : "POST";
    const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error?.message ?? "Erro"); return; }
    window.location.href = `/dashboard/partner/services/${data.data.service.id}`;
  }

  if (mode === "new" || mode === "edit") {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <Input type="number" step="0.01" min="0" placeholder="Preço" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <select className="w-full rounded border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Rascunho</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
            <FileUploadField
              purpose="service_image"
              label="Imagem do serviço"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              accept="image/jpeg,image/png,image/webp"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (mode === "detail" && service) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium text-lg">{service.name}</p>
          <p>{service.description}</p>
          <p>Preço: R$ {service.price.toFixed(2)}</p>
          <p>Status: {service.status}</p>
          <Button asChild size="sm"><Link href={`/dashboard/partner/services/${service.id}/edit`}>Editar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  return (
    <div className="space-y-4">
      <Button asChild><Link href="/dashboard/partner/services/new">Novo serviço</Link></Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {services.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado.
        </p>
      ) : services.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex justify-between p-4">
            <div><p className="font-medium">{s.name}</p><p className="text-sm text-muted-foreground">{s.status}</p></div>
            <Button asChild size="sm" variant="outline"><Link href={`/dashboard/partner/services/${s.id}`}>Ver</Link></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
