import { api } from "@/lib/api";
import type { AppointmentMeta, AppointmentRecord, CreateAppointmentPayload } from "./types";

export function appointmentsApi(token: string) {
  const opts = { token };

  return {
    meta: () => api<AppointmentMeta>("/api/appointments/meta", opts),
    list: (status?: "SCHEDULED" | "COMPLETED" | "CANCELLED") =>
      api<AppointmentRecord[]>(
        status ? `/api/appointments?status=${status}` : "/api/appointments",
        opts
      ),
    get: (id: string) => api<AppointmentRecord>(`/api/appointments/${id}`, opts),
    create: (data: CreateAppointmentPayload) =>
      api<AppointmentRecord>("/api/appointments", {
        ...opts,
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancel: (id: string, reason?: string) =>
      api<AppointmentRecord>(`/api/appointments/${id}/cancel`, {
        ...opts,
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    reschedule: (id: string, data: { scheduledDate: string; scheduledTime: string; observations?: string }) =>
      api<AppointmentRecord>(`/api/appointments/${id}/reschedule`, {
        ...opts,
        method: "POST",
        body: JSON.stringify(data),
      }),
  };
}
