"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClientPetDetailPanel() {
  const params = useParams();
  const petId = String(params.petId);
  const [pet, setPet] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/client/pets/${petId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) setError(d.error?.message ?? "Erro");
        else setPet(d.data.pet);
      });
  }, [petId]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!pet) return <p>Carregando...</p>;

  const vaccinations = (pet.vaccinations as unknown[]) ?? [];
  const allergies = (pet.allergies as unknown[]) ?? [];
  const records = (pet.medicalRecords as unknown[]) ?? [];
  const reminders = (pet.reminders as unknown[]) ?? [];
  const documents = (pet.petDocuments as unknown[]) ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{String(pet.name)}</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Espécie: {String(pet.species)}</p>
          {pet.breed ? <p>Raça: {String(pet.breed)}</p> : null}
          {pet.weight ? <p>Peso: {String(pet.weight)} kg</p> : null}
        </CardContent>
      </Card>
      <Section title="Vacinas" empty="Nenhuma vacina registrada" count={vaccinations.length} href={`/dashboard/client/pets/${petId}/vaccines`} />
      <Section title="Alergias" empty="Nenhuma alergia registrada" count={allergies.length} href={`/dashboard/client/pets/${petId}/health`} />
      <Section title="Histórico de saúde" empty="Nenhum registro de saúde" count={records.length} href={`/dashboard/client/pets/${petId}/health`} />
      <Section title="Lembretes" empty="Nenhum lembrete registrado" count={reminders.length} href={`/dashboard/client/pets/${petId}/reminders`} />
      <Section title="Documentos" empty="Nenhum documento registrado" count={documents.length} href={`/dashboard/client/pets/${petId}/documents`} />
      <div className="flex gap-2">
        <Button asChild size="sm"><Link href={`/dashboard/client/pets/${petId}/edit`}>Editar</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/client/pets">Voltar</Link></Button>
      </div>
    </div>
  );
}

function Section({ title, empty, count, href }: { title: string; empty: string; count: number; href?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="flex items-center justify-between text-sm">
        <span>{count === 0 ? empty : `${count} registro(s)`}</span>
        {href && <Button asChild size="sm" variant="outline"><Link href={href}>Gerenciar</Link></Button>}
      </CardContent>
    </Card>
  );
}
