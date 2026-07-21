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
    <div className="space-y-6 animate-fade-in">
      <ClientPageHeader
        title="Meu Pet"
        description="Cadastre, edite e acompanhe os pets vinculados à sua conta."
        actions={
          <Button size="sm" className="gap-2 rounded-[var(--radius-button)]" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Cadastrar pet
          </Button>
        }
      />

      <ClientFeedback message={feedback} type={feedbackType} />

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-white/10 dark:bg-ecopet-dark-card"
        >
          <h3 className="font-display text-base font-semibold text-ecopet-dark dark:text-white">Novo pet</h3>
          <Input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            aria-label="Nome do pet"
          />
          <select
            className="w-full rounded-[var(--radius-input)] border border-ecopet-gray/20 bg-white px-3 py-2 text-sm text-ecopet-dark dark:border-white/10 dark:bg-ecopet-dark dark:text-white"
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
            <Button type="submit" disabled={saving} className="rounded-[var(--radius-button)]">{saving ? "Salvando..." : "Salvar"}</Button>
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
              className="rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-ecopet-green/10">
                <PawPrint className="h-5 w-5 text-ecopet-green" strokeWidth={2} aria-hidden />
              </div>
              <h3 className="font-display text-lg font-semibold text-ecopet-dark dark:text-white">{pet.name}</h3>
              <p className="text-sm text-ecopet-gray dark:text-white/70">
                {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-[var(--radius-button)]">
                  <Link href={`/dashboard/client/pets/${pet.id}`}>Ver detalhes</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-[var(--radius-button)]">
                  <Link href={`/dashboard/client/pets/${pet.id}/edit`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
                    Editar
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-[var(--radius-button)]">
                  <Link href={`/dashboard/client/pets/${pet.id}/reminders`}>Lembretes</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-ep-danger"
                  onClick={() => handleRemove(pet.id, pet.name)}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
