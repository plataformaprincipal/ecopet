"use client";

import { Suspense } from "react";
import { MyPetDashboard } from "@/components/my-pet/my-pet-dashboard";

export default function MeuPetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ecopet-gray">Carregando...</div>}>
      <MyPetDashboard />
    </Suspense>
  );
}
