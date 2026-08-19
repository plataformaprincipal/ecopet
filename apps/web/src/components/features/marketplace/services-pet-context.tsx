"use client";

import { createContext, useContext } from "react";
import type { PetSpecies } from "@/lib/pets/types";

export type ServicesPetContextValue = {
  petId: string | null;
  petName: string | null;
  petSpecies: PetSpecies | null;
};

const ServicesPetContext = createContext<ServicesPetContextValue>({
  petId: null,
  petName: null,
  petSpecies: null,
});

export function ServicesPetProvider({
  value,
  children,
}: {
  value: ServicesPetContextValue;
  children: React.ReactNode;
}) {
  return <ServicesPetContext.Provider value={value}>{children}</ServicesPetContext.Provider>;
}

export function useServicesPet() {
  return useContext(ServicesPetContext);
}
