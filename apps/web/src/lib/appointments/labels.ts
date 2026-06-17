import type { AppointmentAttendanceMode, AppointmentServiceType, AppointmentStatus } from "./types";

export const SERVICE_LABELS: Record<AppointmentServiceType, string> = {
  BANHO: "Banho",
  TOSA: "Tosa",
  BANHO_TOSA: "Banho e Tosa",
  CONSULTA_VET: "Consulta Veterinária",
  VACINACAO: "Vacinação",
  HOSPEDAGEM: "Hospedagem",
  PASSEIO: "Passeio",
  TELEBUSCA: "Telebusca",
  ENTREGA_PET: "Entrega do Pet",
  OUTROS: "Outros Serviços",
};

export const ATTENDANCE_LABELS: Record<AppointmentAttendanceMode, string> = {
  IN_PERSON: "Atendimento presencial",
  TELEBUSCA: "Tele-busca do pet",
  TUTOR_DELIVERY: "Entrega do pet no local",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const STATUS_TABS = [
  { key: "SCHEDULED" as const, label: "Futuros" },
  { key: "COMPLETED" as const, label: "Concluídos" },
  { key: "CANCELLED" as const, label: "Cancelados" },
];

export function formatAppointmentDateTime(date: string, time: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y} às ${time}`;
}
