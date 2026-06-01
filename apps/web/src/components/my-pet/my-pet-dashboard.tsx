"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PawPrint, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PetForm } from "@/components/my-pet/pet-form";
import { PetDetailView } from "@/components/my-pet/pet-detail-view";
import { petsApi } from "@/lib/pets/api";
import type { CreatePetPayload, PetDetail, PetSummary } from "@/lib/pets/types";
import { SPECIES_LABELS, DEFAULT_PET_PHOTO } from "@/lib/pets/labels";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

export function MyPetDashboard() {
  const { token, loading: userLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PetDetail | null>(null);
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await petsApi(token).list();
      setPets(list);
      if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
    } finally {
      setLoading(false);
    }
  }, [token, selectedId]);

  const loadDetail = useCallback(async (id: string) => {
    if (!token) return;
    const data = await petsApi(token).get(id);
    setDetail(data);
  }, [token]);

  useEffect(() => {
    if (token) void loadPets();
  }, [token, loadPets]);

  useEffect(() => {
    if (selectedId && token) void loadDetail(selectedId);
  }, [selectedId, token, loadDetail]);

  async function handleCreate(data: CreatePetPayload) {
    if (!token) return;
    setSaving(true);
    try {
      const created = await petsApi(token).create(data);
      setShowForm(false);
      setSelectedId(created.id);
      await loadPets();
      setDetail(created);
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || loading) {
    return (
      <>
        <AppHeader title="Meus Pets" />
        <main className="flex-1 p-8 text-center text-sm text-ecopet-gray">Carregando...</main>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <AppHeader title="Meus Pets" />
        <main className="mx-auto max-w-2xl flex-1 p-8 text-center">
          <p className="text-ecopet-gray">Faça login para gerenciar seus pets.</p>
          <Link href="/login"><Button className="mt-4">Entrar</Button></Link>
        </main>
      </>
    );
  }

  if (showForm || pets.length === 0) {
    return (
      <>
        <AppHeader title="Meus Pets" />
        <main className="mx-auto max-w-3xl flex-1 p-4 lg:p-6">
          {pets.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ecopet-green/10">
                <PawPrint className="h-12 w-12 text-ecopet-green" />
              </div>
              <h1 className="mt-6 font-display text-2xl font-bold">Cadastre seu primeiro pet</h1>
              <p className="mt-2 text-ecopet-gray">Prontuário, vacinas, peso, fotos e muito mais em um só lugar.</p>
              <Button className="mt-6" size="lg" onClick={() => setShowForm(true)}>
                <Plus className="h-5 w-5" /> Cadastrar pet
              </Button>
            </div>
          ) : (
            <PetForm onSubmit={handleCreate} loading={saving} onCancel={pets.length > 0 ? () => setShowForm(false) : undefined} />
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Meus Pets" />
      <main className="mx-auto max-w-4xl flex-1 p-4 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {pets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition",
                  selectedId === p.id ? "border-ecopet-green bg-ecopet-green/10" : "border-ecopet-gray/15 hover:bg-ecopet-gray/5"
                )}
              >
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs text-ecopet-gray">{SPECIES_LABELS[p.species]}</span>
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Novo pet
          </Button>
        </div>

        {showForm ? (
          <PetForm onSubmit={handleCreate} loading={saving} onCancel={() => setShowForm(false)} />
        ) : detail && selectedId ? (
          <PetDetailView
            pet={detail}
            token={token}
            onRefresh={() => loadDetail(selectedId)}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-ecopet-gray">Selecione um pet.</CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
