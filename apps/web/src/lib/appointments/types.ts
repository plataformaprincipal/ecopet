export type AppointmentServiceType =
  | "BANHO"
  | "TOSA"
  | "BANHO_TOSA"
  | "CONSULTA_VET"
  | "VACINACAO"
  | "HOSPEDAGEM"
  | "PASSEIO"
  | "TELEBUSCA"
  | "ENTREGA_PET"
  | "OUTROS";

export type AppointmentAttendanceMode = "IN_PERSON" | "TELEBUSCA" | "TUTOR_DELIVERY";

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface AppointmentPetSummary {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birthDate: string | null;
}

export interface AppointmentTutorSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
}

export interface AppointmentRecord {
  id: string;
  serviceType: AppointmentServiceType;
  attendanceMode: AppointmentAttendanceMode;
  scheduledDate: string;
  scheduledTime: string;
  scheduledAt: string;
  observations: string | null;
  status: AppointmentStatus;
  cancelledAt: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  rescheduledFromId: string | null;
  createdAt: string;
  pet: AppointmentPetSummary;
  tutor: AppointmentTutorSummary;
}

export interface AppointmentMeta {
  serviceTypes: AppointmentServiceType[];
  attendanceModes: AppointmentAttendanceMode[];
  timeSlots: string[];
}

export interface CreateAppointmentPayload {
  petId: string;
  serviceType: AppointmentServiceType;
  attendanceMode: AppointmentAttendanceMode;
  scheduledDate: string;
  scheduledTime: string;
  observations?: string;
}
