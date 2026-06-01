import { api } from "@/lib/api";
import type { CreatePetPayload, PetDetail, PetSummary } from "./types";

export function petsApi(token: string) {
  const opts = { token };

  return {
    list: () => api<PetSummary[]>("/api/pets", opts),
    get: (id: string) => api<PetDetail>(`/api/pets/${id}`, opts),
    create: (data: CreatePetPayload) =>
      api<PetDetail>("/api/pets", { ...opts, method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreatePetPayload & Record<string, unknown>>) =>
      api<PetDetail>(`/api/pets/${id}`, { ...opts, method: "PATCH", body: JSON.stringify(data) }),
    addMedicalRecord: (id: string, data: Record<string, unknown>) =>
      api(`/api/pets/${id}/medical-records`, { ...opts, method: "POST", body: JSON.stringify(data) }),
    addVaccination: (id: string, data: Record<string, unknown>) =>
      api(`/api/pets/${id}/vaccinations`, { ...opts, method: "POST", body: JSON.stringify(data) }),
    addMedication: (id: string, data: Record<string, unknown>) =>
      api(`/api/pets/${id}/medications`, { ...opts, method: "POST", body: JSON.stringify(data) }),
    addWeight: (id: string, data: { weight: number; notes?: string; recordedAt?: string }) =>
      api(`/api/pets/${id}/weight-records`, { ...opts, method: "POST", body: JSON.stringify(data) }),
    addMedia: (id: string, data: { type: "photo" | "video"; url: string; caption?: string }) =>
      api(`/api/pets/${id}/media`, { ...opts, method: "POST", body: JSON.stringify(data) }),
    markLost: (id: string, data: { lostCity: string; lostContact: string }) =>
      api(`/api/pets/${id}/lost`, { ...opts, method: "POST", body: JSON.stringify(data) }),
    markFound: (id: string) => api(`/api/pets/${id}/found`, { ...opts, method: "POST", body: "{}" }),
    setAdoption: (id: string, data: Record<string, unknown>) =>
      api(`/api/pets/${id}/adoption`, { ...opts, method: "POST", body: JSON.stringify(data) }),
    meta: () => api<{ medicalRecordTypes: string[]; vaccinePresets: string[] }>("/api/pets/meta", opts),
  };
}

export function getPublicPet(slug: string) {
  return api<Record<string, unknown>>(`/api/public/pets/${slug}`);
}
