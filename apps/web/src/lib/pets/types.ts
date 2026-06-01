export type PetSpecies = "DOG" | "CAT" | "BIRD" | "RODENT" | "REPTILE" | "FISH" | "OTHER";
export type PetSize = "MINI" | "SMALL" | "MEDIUM" | "LARGE" | "GIANT";

export interface PetAttachment {
  name: string;
  type: string;
  size?: number;
  url?: string;
}

export interface PetSummary {
  id: string;
  name: string;
  photo: string | null;
  species: PetSpecies;
  breed: string | null;
  age?: string;
  weight: number | null;
  isLost?: boolean;
  availableForAdoption?: boolean;
  owner?: { id: string; name: string };
}

export interface PetDetail extends PetSummary {
  sex: string | null;
  birthDate: string | null;
  color: string | null;
  size: PetSize | null;
  neutered: boolean;
  hasMicrochip: boolean;
  microchip: string | null;
  photos: string[] | null;
  temperament: string | null;
  rescueHistory: string | null;
  specialNeeds: string | null;
  dietaryRestriction: string | null;
  allergiesText: string | null;
  notes: string | null;
  qrCodeSlug: string | null;
  publicProfile: boolean;
  locationAddress: string | null;
  locationCity: string | null;
  locationState: string | null;
  isLost: boolean;
  lostAt: string | null;
  lostCity: string | null;
  lostContact: string | null;
  availableForAdoption: boolean;
  adoptionReason: string | null;
  adoptionRequirements: string | null;
  adoptionCity: string | null;
  adoptionFee: number | null;
  aiProfile: { enabled: boolean; capabilities: string[]; insights: unknown[] } | null;
  vaccinations: VaccinationRecord[];
  medications: MedicationRecord[];
  medicalRecords: MedicalRecordItem[];
  weightRecords: WeightRecord[];
  media: PetMediaItem[];
  events: PetEventItem[];
  vaccineAlerts?: { name: string; status: string; message: string }[];
  medicationReminders?: { name: string; message: string }[];
  ong?: { id: string; name: string } | null;
  protector?: { id: string; name: string } | null;
}

export interface VaccinationRecord {
  id: string;
  name: string;
  manufacturer: string | null;
  batch: string | null;
  date: string;
  nextDue: string | null;
  veterinarian: string | null;
  notes: string | null;
}

export interface MedicationRecord {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
}

export interface MedicalRecordItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  recordDate: string;
  veterinarianName: string | null;
  clinicName: string | null;
  attachments: PetAttachment[] | null;
  author?: { id: string; name: string; role: string };
}

export interface WeightRecord {
  id: string;
  weight: number;
  recordedAt: string;
  notes: string | null;
}

export interface PetMediaItem {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  recordedAt: string;
}

export interface PetEventItem {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

export interface CreatePetPayload {
  name: string;
  species: PetSpecies;
  breed: string;
  sex: string;
  birthDate?: string;
  color: string;
  weight?: number;
  size?: PetSize;
  neutered?: boolean;
  hasMicrochip?: boolean;
  microchip?: string;
  photo?: string;
  temperament?: string;
  rescueHistory?: string;
  specialNeeds?: string;
  dietaryRestriction?: string;
  allergiesText?: string;
  notes?: string;
  locationCity?: string;
  locationState?: string;
  locationAddress?: string;
}
