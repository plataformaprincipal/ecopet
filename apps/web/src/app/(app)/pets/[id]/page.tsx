"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layouts/app-header";
import { PetDetailView } from "@/components/features/my-pet/pet-detail-view";
import { petsApi } from "@/lib/pets/api";
import type { PetDetail } from "@/lib/pets/types";
import { useCurrentUser } from "@/hooks/use-current-user";

function PetProfileContent() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { token, loading: userLoading } = useCurrentUser();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    petsApi(token)
      .get(id)
      .then(setPet)
      .catch(() => setError("Pet não encontrado ou sem permissão."));
  }, [token, id]);

  if (userLoading) return <main className="p-8 text-center text-sm">Carregando...</main>;
  if (!token) {
    router.push("/login");
    return null;
  }
  if (error) return <main className="p-8 text-center text-red-500">{error}</main>;
  if (!pet) return <main className="p-8 text-center text-sm">Carregando pet...</main>;

  return (
    <>
      <AppHeader title={pet.name} />
      <main className="mx-auto max-w-4xl flex-1 p-4 lg:p-6">
        <PetDetailView pet={pet} token={token} onRefresh={() => petsApi(token).get(id).then(setPet)} />
      </main>
    </>
  );
}

export default function PetProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Carregando...</div>}>
      <PetProfileContent />
    </Suspense>
  );
}
