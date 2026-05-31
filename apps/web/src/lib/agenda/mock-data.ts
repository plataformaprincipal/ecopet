import type { AgendaEvent } from "./types";

export const AGENDA_EVENTS: AgendaEvent[] = [
  { id: "e1", title: "Consulta — Luna", type: "consultation", date: "2026-05-28", time: "10:00", duration: "45min", partner: "Dr. Carlos Mendes", status: "confirmed", recurring: false },
  { id: "e2", title: "Banho & Tosa — Luna", type: "service", date: "2026-05-28", time: "14:00", duration: "1h30", partner: "Pet Shop Amigo", status: "confirmed", recurring: false },
  { id: "e3", title: "Dog Walker — Thor", type: "service", date: "2026-05-28", time: "16:00", duration: "1h", partner: "Dog Walker SP", status: "confirmed", recurring: true },
  { id: "e4", title: "Vacina V10 — Thor", type: "health", date: "2026-06-05", time: "09:30", duration: "30min", partner: "VetCare Premium", status: "pending", recurring: false },
  { id: "e5", title: "Reunião equipe", type: "meeting", date: "2026-05-29", time: "11:00", duration: "1h", partner: "Interno", status: "confirmed", recurring: false },
  { id: "e6", title: "Campanha adoção", type: "campaign", date: "2026-06-15", time: "09:00", duration: "4h", partner: "Amigos de 4 Patas", status: "confirmed", recurring: false },
];

export const AGENDA_WEEK = [
  { day: "Seg", events: 3 },
  { day: "Ter", events: 2 },
  { day: "Qua", events: 4 },
  { day: "Qui", events: 1 },
  { day: "Sex", events: 5 },
  { day: "Sáb", events: 2 },
  { day: "Dom", events: 0 },
];
