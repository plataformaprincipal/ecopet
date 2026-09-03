export const NO_VET_AVAILABLE_COPY =
  "Não encontramos um veterinário disponível pelo EccoPet neste momento. Se houver sinais de emergência, procure imediatamente uma clínica veterinária ou plantão presencial.";

export type EmergencyVetCard = {
  id: string;
  name: string;
  price: number | null;
  partnerName: string;
  location: string;
  crmv: string | null;
  specialty: string | null;
  modality: string | null;
  openToday: boolean | null;
  verified: boolean;
  href: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function mapEmergencyServices(raw: unknown): EmergencyVetCard[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const item = asRecord(row);
      if (!item || typeof item.id !== "string") return null;
      const provider = asRecord(item.provider);
      const profile = asRecord(provider?.partnerProfile);
      const vet = asRecord(provider?.veterinarianProfile);
      const city = str(item.city) ?? str(profile?.city);
      const state = str(item.state) ?? str(profile?.state);
      const specialties = vet?.specialties;
      const specialty = Array.isArray(specialties) ? str(specialties[0]) : str(specialties);
      return {
        id: item.id,
        name: str(item.name) ?? "Serviço veterinário",
        price: typeof item.price === "number" ? item.price : null,
        partnerName: str(profile?.businessName) ?? str(provider?.name) ?? "Parceiro EccoPet",
        location: [city, state].filter(Boolean).join(" · "),
        crmv: str(vet?.crmv),
        specialty,
        modality: str(item.modality),
        openToday: typeof item.openToday === "boolean" ? item.openToday : null,
        verified: item.isVerified === true,
        href: `/marketplace/servico/${item.id}`,
      } satisfies EmergencyVetCard;
    })
    .filter((row): row is EmergencyVetCard => row != null);
}
