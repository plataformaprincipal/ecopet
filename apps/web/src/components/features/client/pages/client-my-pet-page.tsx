"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientPageHeader } from "../client-page-header";
import { ClientEmptyState } from "../client-empty-state";
import { ClientGridSkeleton } from "../client-skeleton";
import { ClientFeedback } from "../client-stats-cards";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
};

export function ClientMyPetPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [form, setForm] = useState({
    name: "",
    species: "DOG",
    breed: "",
    birthDate: "",
    weight: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/client/pets", { credentials: "include" });
    const json = await res.json();
    if (json.success) setPets(json.data.pets ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback("");
    const res = await fetch("/api/client/pets", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        birthDate: form.birthDate || null,
        weight: form.weight ? Number(form.weight) : null,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      setFeedback(json.error?.message ?? "Erro ao cadastrar pet.");
      setFeedbackType("error");
      return;
    }
    setFeedback("Pet cadastrado com sucesso.");
    setFeedbackType("success");
    setShowForm(false);
    setForm({ name: "", species: "DOG", breed: "", birthDate: "", weight: "" });
    load();
  }

  async function handleRemove(petId: string, petName: string) {
    if (!confirm(`Remover ${petName}? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/client/pets/${petId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json();
    if (json.success) {
      setFeedback("Pet removido.");
      setFeedbackType("success");
      load();
    } else {
      setFeedback(json.error?.message ?? "Erro ao remover.");
      setFeedbackType("error");
    }
  }

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Meu Pet"
        description="Cadastre, edite e acompanhe os pets vinculados à sua conta."
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Cadastrar pet
          </Button>
        }
      />

      <ClientFeedback message={feedback} type={feedbackType} />

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60"
        >
          <h3 className="font-medium">Novo pet</h3>
          <Input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            aria-label="Nome do pet"
          />
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-zinc-950"
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            aria-label="Espécie"
          >
            <option value="DOG">Cão</option>
            <option value="CAT">Gato</option>
            <option value="BIRD">Ave</option>
            <option value="OTHER">Outro</option>
          </select>
          <Input placeholder="Raça" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} aria-label="Data de nascimento" />
          <Input type="number" step="0.1" placeholder="Peso (kg)" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      {loading ? (
        <ClientGridSkeleton count={3} />
      ) : pets.length === 0 ? (
        <ClientEmptyState
          icon={PawPrint}
          title="Nenhum pet cadastrado"
          description="Cadastre seu primeiro pet para organizar lembretes, histórico e agendamentos."
          actionLabel="Cadastrar meu primeiro pet"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pets.map((pet) => (
            <article
              key={pet.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
            >
              <h3 className="font-display text-lg font-semibold">{pet.name}</h3>
              <p className="text-sm text-zinc-500">
                {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/client/pets/${pet.id}`}>Ver detalhes</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/client/pets/${pet.id}/edit`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Editar
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/client/pets/${pet.id}/reminders`}>Lembretes</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => handleRemove(pet.id, pet.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
