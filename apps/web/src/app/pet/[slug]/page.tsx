"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, PawPrint, Phone } from "lucide-react";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicPet } from "@/lib/pets/api";
import { SPECIES_LABELS, DEFAULT_PET_PHOTO, computeAgeFromBirthDate } from "@/lib/pets/labels";

export default function PublicPetPage() {
  const params = useParams();
  const slug = String(params.slug);
  const [pet, setPet] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicPet(slug)
      .then(setPet)
      .catch(() => setError("Pet não encontrado ou perfil não público."));
  }, [slug]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <EcoPetLogo variant="light" showText />
        <p className="mt-6 text-red-500">{error}</p>
        <Link href="/" className="mt-4 text-ecopet-green hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  if (!pet) return <div className="p-8 text-center text-sm">Carregando...</div>;

  const photo = (pet.photo as string) || DEFAULT_PET_PHOTO;
  const isLost = Boolean(pet.isLost);
  const forAdoption = Boolean(pet.availableForAdoption);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <EcoPetLogo href="/" variant="light" size="sm" showText />
          <Badge variant="outline">ECOPET ID</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-4">
        {isLost && (
          <Card className="border-red-500/40 bg-red-50">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <div>
                <p className="font-bold text-red-700">Pet perdido</p>
                <p className="text-sm text-red-600">
                  {pet.lostCity as string} · {pet.lostAt ? new Date(pet.lostAt as string).toLocaleDateString("pt-BR") : ""}
                </p>
                {pet.lostContact ? (
                  <a href={`tel:${String(pet.lostContact)}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-red-700">
                    <Phone className="h-4 w-4" /> {String(pet.lostContact)}
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="relative aspect-square">
            <Image src={photo} alt={String(pet.name)} fill className="object-cover" unoptimized />
          </div>
          <CardContent className="p-4 space-y-2">
            <h1 className="font-display text-2xl font-bold">{String(pet.name)}</h1>
            <p className="text-sm text-ecopet-gray">
              {pet.breed as string} · {SPECIES_LABELS[pet.species as keyof typeof SPECIES_LABELS]} · {computeAgeFromBirthDate(pet.birthDate as string)}
            </p>
            {forAdoption && (
              <Badge className="bg-ecopet-yellow text-ecopet-dark"><PawPrint className="mr-1 h-3 w-3" /> Disponível para adoção</Badge>
            )}
            {pet.adoptionReason ? <p className="text-sm">{String(pet.adoptionReason)}</p> : null}
            {pet.adoptionRequirements ? <p className="text-xs text-ecopet-gray">Requisitos: {String(pet.adoptionRequirements)}</p> : null}
            {pet.adoptionFee != null && Number(pet.adoptionFee) > 0 && (
              <p className="text-sm font-medium">Taxa: R$ {Number(pet.adoptionFee).toFixed(2)}</p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
              <div><span className="text-ecopet-gray">Cor:</span> {String(pet.color ?? "—")}</div>
              <div><span className="text-ecopet-gray">Sexo:</span> {String(pet.sex ?? "—")}</div>
              <div><span className="text-ecopet-gray">Cidade:</span> {String(pet.locationCity ?? pet.adoptionCity ?? "—")}</div>
              <div><span className="text-ecopet-gray">Microchip:</span> {pet.hasMicrochip ? String(pet.microchip ?? "Sim") : "Não"}</div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-ecopet-gray">
          Página pública ECOPET · QR Code: {slug}
        </p>
      </main>
    </div>
  );
}
