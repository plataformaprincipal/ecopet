"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, PawPrint, Plus } from "lucide-react";
import { PetSpecies } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OngPageHeader } from "../ong-page-header";
import { OngPageSkeleton } from "../ong-skeleton";
import { OngEmptyState } from "../ong-empty-state";
import { OngAnimalCard } from "../ong-animal-card";
import { OngAdoptionRequestCard } from "../ong-adoption-request-card";
import type { SerializedOngListing } from "@/lib/ong/serialize-listing";
import type { OngAccessLevel } from "@/lib/ong/access";
import { SPECIES_LABELS } from "@/lib/pets/labels";
import { SIZE_LABELS } from "@/lib/pets/labels";
import type { OngAnimalDisplayStatus } from "@/lib/ong/adoption-listing-meta";

type Tab = "animais" | "solicitacoes" | "historico";

type FormState = {
  name: string;
  species: PetSpecies;
  breed: string;
  age: string;
  size: string;
  sex: string;
  healthCondition: string;
  vaccinated: boolean;
  neutered: boolean;
  city: string;
  state: string;
  photos: string;
  description: string;
  requirementsText: string;
  displayStatus: OngAnimalDisplayStatus;
};

const emptyForm = (): FormState => ({
  name: "",
  species: PetSpecies.DOG,
  breed: "",
  age: "",
  size: "",
  sex: "",
  healthCondition: "",
  vaccinated: false,
  neutered: false,
  city: "",
  state: "",
  photos: "",
  description: "",
  requirementsText: "",
  displayStatus: "disponivel",
});

type OngAdoptionsPageProps = {
  accessLevel: OngAccessLevel;
};

export function OngAdoptionsPage({ accessLevel }: OngAdoptionsPageProps) {
  const [tab, setTab] = useState<Tab>("animais");
  const [listings, setListings] = useState<SerializedOngListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [statusModalId, setStatusModalId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OngAnimalDisplayStatus>("disponivel");

  const canManage = accessLevel === "full";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ong/adoption-listings", { credentials: "include" });
      const json = await res.json();
      if (json.success) setListings(json.data.listings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    setFeedback(null);
  };

  const openEdit = (listing: SerializedOngListing) => {
    setEditingId(listing.id);
    setForm({
      name: listing.name,
      species: listing.species as PetSpecies,
      breed: listing.breed ?? "",
      age: listing.age ?? "",
      size: listing.size ?? "",
      sex: listing.sex ?? "",
      healthCondition: listing.healthCondition ?? "",
      vaccinated: listing.vaccinated,
      neutered: listing.neutered,
      city: listing.city ?? "",
      state: listing.state ?? "",
      photos: listing.photos.join("\n"),
      description: listing.description,
      requirementsText: listing.requirementsText,
      displayStatus: listing.displayStatus as OngAnimalDisplayStatus,
    });
    setFormOpen(true);
    setFeedback(null);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setFeedback({ type: "error", message: "Nome e descrição são obrigatórios." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    const photos = form.photos
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed || null,
      age: form.age || null,
      size: form.size || null,
      sex: form.sex || null,
      healthCondition: form.healthCondition || null,
      vaccinated: form.vaccinated,
      neutered: form.neutered,
      city: form.city || null,
      state: form.state || null,
      photos,
      description: form.description.trim(),
      requirementsText: form.requirementsText || null,
      displayStatus: form.displayStatus,
    };

    try {
      const url = editingId
        ? `/api/ong/adoption-listings/${editingId}`
        : "/api/ong/adoption-listings";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setFeedback({ type: "error", message: json.error?.message ?? "Erro ao salvar." });
        return;
      }
      setFeedback({ type: "success", message: editingId ? "Animal atualizado." : "Animal cadastrado." });
      setFormOpen(false);
      await load();
    } catch {
      setFeedback({ type: "error", message: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  };

  const deleteListing = async (id: string, name: string) => {
    if (!window.confirm(`Remover o animal "${name}"? Esta ação não pode ser desfeita.`)) return;

    const res = await fetch(`/api/ong/adoption-listings/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json();
    if (json.success) {
      setFeedback({ type: "success", message: "Animal removido." });
      await load();
    } else {
      setFeedback({ type: "error", message: json.error?.message ?? "Erro ao remover." });
    }
  };

  const saveStatus = async () => {
    if (!statusModalId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ong/adoption-listings/${statusModalId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayStatus: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusModalId(null);
        setFeedback({ type: "success", message: "Status atualizado." });
        await load();
      } else {
        setFeedback({ type: "error", message: json.error?.message ?? "Erro ao atualizar status." });
      }
    } finally {
      setSaving(false);
    }
  };

  const activeListings = listings.filter(
    (l) => l.displayStatus !== "adotado" && l.displayStatus !== "indisponivel"
  );
  const pendingListings = listings.filter((l) => l.displayStatus === "em_analise");
  const historyListings = listings.filter((l) => l.displayStatus === "adotado");

  if (loading) return <OngPageSkeleton />;

  return (
    <div className="space-y-6">
      <OngPageHeader
        title="Adoções e Animais"
        description="Cadastre e gerencie animais disponíveis, acompanhe solicitações e histórico de adoções."
        actions={
          canManage ? (
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Cadastrar animal
            </Button>
          ) : null
        }
      />

      {feedback ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
              : "border border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
          }`}
          role="status"
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="inline-flex rounded-xl border border-zinc-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        {(
          [
            ["animais", "Animais"],
            ["solicitacoes", "Solicitações"],
            ["historico", "Histórico"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-emerald-700 text-white dark:bg-emerald-600"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "animais" && (
        <>
          {!canManage ? (
            <OngEmptyState
              icon={PawPrint}
              title="Cadastro disponível após aprovação"
              description="Após a análise da sua conta, você poderá cadastrar animais para adoção pública."
              actionLabel="Completar perfil"
              actionHref="/ong/perfil-gestao"
            />
          ) : activeListings.length === 0 ? (
            <OngEmptyState
              icon={PawPrint}
              title="Nenhum animal cadastrado"
              description="Cadastre animais com fotos, descrição e requisitos para divulgação."
              actionLabel="Cadastrar animal"
              onAction={openCreate}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeListings.map((listing) => (
                <div key={listing.id} className="space-y-2">
                  <OngAnimalCard
                    listing={listing}
                    onEdit={() => openEdit(listing)}
                    onChangeStatus={() => {
                      setStatusModalId(listing.id);
                      setNewStatus(listing.displayStatus as OngAnimalDisplayStatus);
                    }}
                    onViewInterested={() => window.open("/dashboard/messages", "_self")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => void deleteListing(listing.id, listing.name)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "solicitacoes" && (
        <>
          {pendingListings.length === 0 ? (
            <OngEmptyState
              icon={Heart}
              title="Nenhuma solicitação em andamento"
              description="Animais com status em análise aparecem aqui. Interessados podem entrar em contato via mensagens."
              actionHref="/dashboard/messages"
              actionLabel="Ver mensagens"
            />
          ) : (
            <div className="space-y-3">
              {pendingListings.map((listing) => (
                <OngAdoptionRequestCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "historico" && (
        <>
          {historyListings.length === 0 ? (
            <OngEmptyState
              icon={Heart}
              title="Nenhuma adoção concluída"
              description="Quando um animal for adotado, ele aparecerá no histórico."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {historyListings.map((listing) => (
                <OngAnimalCard key={listing.id} listing={listing} canManage={false} />
              ))}
            </div>
          )}
        </>
      )}

      {formOpen && canManage ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900"
            role="dialog"
            aria-labelledby="animal-form-title"
          >
            <h2 id="animal-form-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingId ? "Editar animal" : "Cadastrar animal"}
            </h2>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Nome *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <select
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={form.species}
                onChange={(e) => setForm((f) => ({ ...f, species: e.target.value as PetSpecies }))}
              >
                {Object.entries(SPECIES_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Input placeholder="Raça" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} />
              <Input placeholder="Idade aproximada" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
              <select
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              >
                <option value="">Porte</option>
                {Object.entries(SIZE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Input placeholder="Sexo" value={form.sex} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))} />
              <Input
                placeholder="Condição de saúde"
                value={form.healthCondition}
                onChange={(e) => setForm((f) => ({ ...f, healthCondition: e.target.value }))}
              />
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.vaccinated}
                    onChange={(e) => setForm((f) => ({ ...f, vaccinated: e.target.checked }))}
                  />
                  Vacinado
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.neutered}
                    onChange={(e) => setForm((f) => ({ ...f, neutered: e.target.checked }))}
                  />
                  Castrado
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Cidade" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                <Input placeholder="Estado" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                placeholder="URLs das fotos (uma por linha)"
                value={form.photos}
                onChange={(e) => setForm((f) => ({ ...f, photos: e.target.value }))}
              />
              <textarea
                className="min-h-[100px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                placeholder="Descrição *"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <textarea
                className="min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                placeholder="Requisitos para adoção"
                value={form.requirementsText}
                onChange={(e) => setForm((f) => ({ ...f, requirementsText: e.target.value }))}
              />
              <select
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={form.displayStatus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayStatus: e.target.value as OngAnimalDisplayStatus }))
                }
              >
                <option value="disponivel">Disponível</option>
                <option value="em_analise">Em análise</option>
                <option value="adotado">Adotado</option>
                <option value="indisponivel">Indisponível</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void submitForm()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {statusModalId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Alterar status</h3>
            <select
              className="mt-4 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OngAnimalDisplayStatus)}
            >
              <option value="disponivel">Disponível</option>
              <option value="em_analise">Em análise</option>
              <option value="adotado">Adotado</option>
              <option value="indisponivel">Indisponível</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStatusModalId(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void saveStatus()} disabled={saving}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
