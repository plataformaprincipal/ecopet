"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Pet = { id: string; name: string; species: string; breed?: string | null };

export function ClientPetsPanel({ mode = "list" }: { mode?: "list" | "new" }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", species: "DOG", breed: "", birthDate: "", weight: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/client/pets", { credentials: "include" });
    const data = await res.json();
    if (!data.success) {
      setError(data.error?.message ?? "Erro ao carregar pets");
      setPets([]);
    } else {
      setPets(data.data.pets);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
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
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      setError(data.error?.message ?? "Erro ao criar pet");
      return;
    }
    window.location.href = `/dashboard/client/pets/${data.data.pet.id}`;
  }

  if (mode === "new") {
    return (
      <Card>
        <CardHeader><CardTitle>Cadastrar pet</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <select className="w-full rounded border px-3 py-2" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
              <option value="DOG">Cão</option>
              <option value="CAT">Gato</option>
              <option value="BIRD">Ave</option>
              <option value="OTHER">Outro</option>
            </select>
            <Input placeholder="Raça" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
            <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            <Input type="number" step="0.1" min="0" placeholder="Peso (kg)" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando pets...</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button asChild><Link href="/dashboard/client/pets/new">Cadastrar pet</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/client">Voltar</Link></Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {pets.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum pet cadastrado ainda.
        </p>
      ) : (
        pets.map((pet) => (
          <Card key={pet.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{pet.name}</p>
                <p className="text-sm text-muted-foreground">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
              </div>
              <Button asChild size="sm" variant="outline"><Link href={`/dashboard/client/pets/${pet.id}`}>Ver</Link></Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
