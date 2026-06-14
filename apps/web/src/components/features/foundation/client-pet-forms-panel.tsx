"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";

const RESOURCE_LABELS: Record<string, string> = {
  vaccination: "vacina",
  allergy: "alergia",
  health: "registro de saúde",
  reminder: "lembrete",
  document: "documento",
};

export function ClientPetEditPanel() {
  const params = useParams();
  const petId = String(params.petId);
  const [form, setForm] = useState({ name: "", species: "DOG", breed: "", weight: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/client/pets/${petId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const p = d.data.pet;
          setForm({ name: p.name, species: p.species, breed: p.breed ?? "", weight: p.weight ? String(p.weight) : "" });
        }
      });
  }, [petId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/client/pets/${petId}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, species: form.species, breed: form.breed || null, weight: form.weight ? Number(form.weight) : null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error?.message ?? "Erro"); return; }
    window.location.href = `/dashboard/client/pets/${petId}`;
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <form onSubmit={handleSave} className="space-y-3">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select className="w-full rounded border px-3 py-2" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
            <option value="DOG">Cão</option><option value="CAT">Gato</option><option value="OTHER">Outro</option>
          </select>
          <Input placeholder="Raça" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <Input type="number" step="0.1" min="0" placeholder="Peso" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </form>
        <Button asChild variant="outline"><Link href={`/dashboard/client/pets/${petId}`}>Cancelar</Link></Button>
      </CardContent>
    </Card>
  );
}

export function ClientPetResourcePanel({ resource }: { resource: "vaccination" | "allergy" | "health" | "reminder" | "document" }) {
  const params = useParams();
  const petId = String(params.petId);
  const [items, setItems] = useState<unknown[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ name: "", title: "", type: "", dueAt: "", appliedAt: "" });
  const [docMeta, setDocMeta] = useState<{ url?: string; mimeType?: string; sizeBytes?: number }>({});

  useEffect(() => {
    fetch(`/api/client/pets/${petId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const p = d.data.pet;
        const map: Record<string, unknown[]> = {
          vaccination: p.vaccinations ?? [],
          allergy: p.allergies ?? [],
          health: p.medicalRecords ?? [],
          reminder: p.reminders ?? [],
          document: p.petDocuments ?? [],
        };
        setItems(map[resource] ?? []);
      });
  }, [petId, resource]);

  const emptyMessages: Record<string, string> = {
    vaccination: "Nenhuma vacina registrada",
    allergy: "Nenhuma alergia registrada",
    health: "Nenhum registro de saúde",
    reminder: "Nenhum lembrete registrado",
    document: "Nenhum documento registrado",
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data: Record<string, unknown> = {};
    if (resource === "vaccination") { data.name = form.name; data.appliedAt = form.appliedAt || new Date().toISOString().slice(0, 10); }
    if (resource === "allergy") { data.name = form.name; }
    if (resource === "health") { data.type = form.type || "CONSULTA"; data.title = form.title || form.name; data.eventDate = form.appliedAt || new Date().toISOString().slice(0, 10); }
    if (resource === "reminder") { data.type = form.type || "GERAL"; data.title = form.title || form.name; data.dueAt = form.dueAt ? new Date(form.dueAt).toISOString() : new Date(Date.now() + 86400000).toISOString(); }
    if (resource === "document") {
      data.type = form.type || "OUTRO";
      data.name = form.name;
      if (docMeta.url) {
        data.url = docMeta.url;
        data.mimeType = docMeta.mimeType;
        data.sizeBytes = docMeta.sizeBytes;
      }
    }

    const res = await fetch(`/api/client/pets/${petId}/health`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, data }),
    });
    const result = await res.json();
    setSaving(false);
    if (!result.success) { setError(result.error?.message ?? "Erro"); return; }
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessages[resource]}</p>
      ) : (
        <p className="text-sm">{items.length} registro(s)</p>
      )}
      <Card>
        <CardContent className="space-y-3 p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <Input placeholder="Nome / título" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            {(resource === "vaccination" || resource === "health") && (
              <Input type="date" value={form.appliedAt} onChange={(e) => setForm({ ...form, appliedAt: e.target.value })} />
            )}
            {resource === "document" && (
              <FileUploadField
                purpose="pet_document"
                label="Arquivo do documento"
                value={docMeta.url}
                onChange={(url, meta) => setDocMeta({ url, mimeType: meta?.mimeType, sizeBytes: meta?.sizeBytes })}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                allowManualUrl={false}
              />
            )}
            {resource === "reminder" && (
              <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving}>Adicionar {RESOURCE_LABELS[resource]}</Button>
          </form>
        </CardContent>
      </Card>
      <Button asChild variant="outline"><Link href={`/dashboard/client/pets/${petId}`}>Voltar ao pet</Link></Button>
    </div>
  );
}
