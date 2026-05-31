export interface MyPetData {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  photo: string;
  healthStatus: "excellent" | "good" | "attention";
  qrCode: string;
  vaccines: { name: string; date: string; next?: string }[];
  consultations: { date: string; vet: string; reason: string }[];
  medications: { name: string; dose: string; until?: string }[];
  exams: { name: string; date: string; status: string }[];
  routine: { feeding: string; walk: string; bath: string; sleep: string; activity: string };
  aiAlerts: { id: string; text: string; type: "info" | "warning" | "health" }[];
  aiRecommendations: string[];
  scheduledServices: { name: string; date: string; partner: string }[];
  social: { posts: number; followers: number; likes: number };
}

export const MOCK_MY_PET: MyPetData = {
  id: "pet1",
  name: "Luna",
  species: "Cão",
  breed: "Golden Retriever",
  age: "3 anos",
  weight: "28 kg",
  photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
  healthStatus: "good",
  qrCode: "ECOPET-LUNA-001",
  vaccines: [
    { name: "V10", date: "2026-03-15", next: "2027-03-15" },
    { name: "Antirrabica", date: "2026-01-20", next: "2027-01-20" },
    { name: "Vermífugo", date: "2026-05-01", next: "2026-11-01" },
  ],
  consultations: [
    { date: "2026-04-10", vet: "Dr. Carlos Mendes", reason: "Check-up anual" },
    { date: "2026-02-05", vet: "VetCare Premium", reason: "Dermatite leve" },
  ],
  medications: [{ name: "Omega 3", dose: "1 cápsula/dia", until: "Contínuo" }],
  exams: [
    { name: "Hemograma", date: "2026-04-10", status: "Normal" },
    { name: "Raio-X", date: "2026-02-05", status: "OK" },
  ],
  routine: {
    feeding: "2x/dia — Ração Golden 15kg",
    walk: "2 passeios/dia (~45 min)",
    bath: "A cada 15 dias",
    sleep: "~10h/noite",
    activity: "Alta — 8.500 passos/dia",
  },
  aiAlerts: [
    { id: "a1", text: "Vacina V10 em dia ✓", type: "info" },
    { id: "a2", text: "Próximo banho recomendado em 5 dias", type: "warning" },
    { id: "a3", text: "Hidratação extra recomendada esta semana", type: "health" },
  ],
  aiRecommendations: [
    "Ração Premium Golden continua ideal para Luna",
    "Agendar banho & tosa na Pet Shop Amigo",
    "Passeio matinal aumentou bem-estar em 12%",
  ],
  scheduledServices: [
    { name: "Banho & Tosa", date: "2026-05-28 14:00", partner: "Pet Shop Amigo" },
  ],
  social: { posts: 42, followers: 128, likes: 890 },
};
